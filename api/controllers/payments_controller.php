<?php
class PaymentsController extends AppController {

	var $name = 'Payments';
	var $uses = array(
					'Account',
					'Ledger',
					'Transaction',
					'Booklet',
					'AccountSchedule',
					'AccountFee',
					'TransactionPayment',
					'TransactionDetail',
					'AccountHistory',
					'AccountTransaction',
					'Reservation',
					'YearLevel',
					'Student',
					'Inquiry',
					'Assessment'
				);
	
	function add() {
		$payments =  $this->data['Payment'];
		$accountType=$this->data['Student']['account_type'];
		
		if(isset($this->data['Type'])){
			if($accountType=='inquiry'){
				$this->SaveInquiry($this->data);
			}else{
				$this->SaveOthers($this->data);
			}
		}else{
			$student = $this->data['Student'];
			$transactions = $this->data['Transaction'];
			$booklet = $this->data['Booklet'];
			$account_id = $student['id'];
			$ESP =  $this->data['Cashier']['esp'];
			$TOTAL_DUE =  $this->data['Cashier']['total_due'];
			$USERNAME =  $this->Auth->user()['User']['username'];
			$schedules = $this->AccountSchedule->find('all',array('recursive'=>-1,'conditions'=>array('AccountSchedule.account_id'=>$account_id)));
			$fees = $this->AccountFee->find('all',array('recursive'=>0,'conditions'=>array('account_id'=>$account_id)));

			$acc = $this->Account->find('first',array('recursive'=>0,'conditions'=>array('id'=>$account_id)));
			$Account = $acc['Account'];
			$payment_to_date = $Account['payment_total'];
			$curr_refNo = $booklet['receipt_type']. ' ' .$booklet['series_counter'];
			$total_payment = 0;
			$today =  date("Y-m-d", strtotime($this->data['Cashier']['date']));
			$time = date("h:i:s");
			//pr($this->data);
			//pr($this->data); exit();
			
			if($booklet['series_counter']<$booklet['series_end']){
				if(isset($booklet['mark'])){
					if($booklet['mark']=='bypass'){
						$booklet['series_counter']=$booklet['InitialCtr'];
					}else{
						$series=$booklet['series_counter']+1;
						do{
						$result = $this->Ledger->find('first',array('recursive'=>0,'conditions'=>array('Ledger.ref_no'=>'OR '.$series)));
							$series++;
						}while(!empty($result));
						$series--;
						$booklet['series_counter'] = $series;
					}
				}else{
					$series=$booklet['series_counter']+1;
					do{
					$result = $this->Ledger->find('first',array('recursive'=>0,'conditions'=>array('Ledger.ref_no'=>'OR '.$series)));
						$series++;
					}while(!empty($result));
					$series--;
					$booklet['series_counter'] = $series;
				}
			}else
				$booklet['status'] = 'CONSM';
			
			
			
			$transac_payments = array();
			$ledger_accounts = array();
			$account_transac = array();
			$account_history = array();
			$transac_details = array();
			$payment_modes = array();
			
			$t_payment = 0;
			foreach($this->data['Payment'] as $i=>$t){
				$t_payment += $t['amount'];
				if($t['id']=='CHCK')
					$CHECK = true;
			}
			
			// For transactions table
			$transac_data = array(
								'type'=>'payment',
								'status'=>'fulfilled',
								'booklet_id'=>$booklet['id'],
								'ref_no'=>$curr_refNo,
								'esp' => $ESP,
								'amount'=> $TOTAL_DUE,
								'transac_date'=>$today,
								'transac_time'=>$time,
								'cashier'=>$USERNAME,
								'account_id'=>$account_id);
			if(isset($CHECK))
				$transac_data['amount']=$t_payment;
			
			
			
			$this->Transaction->saveAll($transac_data);
			
			$transac_id = $this->Transaction->id;
			
			$isCharge = false;
			// to get the total payment of all payments and save transac payments
			foreach($payments as $i=>$pay){
				$tp = array('transaction_id'=>$transac_id,'payment_method_id'=>$pay['id'],'amount'=>$pay['amount']);
				if($pay['id']!=='CASH'){
					$tp['valid_on']=$pay['date'];
					$tp['details']=$pay['bank'];
					$isCharge = $pay['bank'];
				}
				else
					$tp['details']='Cash';
				array_push($payment_modes,$pay['id']);
				array_push($transac_payments,$tp);
				$total_payment += $pay['amount'];
			}
			$account_total = $Account['discount_amount']+$total_payment;
			
			
			//exit();
			
			// for Ledgers and Account transactions
			$transac_payment = $total_payment;
			foreach($transactions as $trnx){
				if($trnx['id']=='INIPY'){
					$Account = $this->createStudent($this->data);
					$schedules = $this->AccountSchedule->find('all',array('recursive'=>-1,'conditions'=>array('AccountSchedule.account_id'=>$Account['id'])));
					$fees = $this->AccountFee->find('all',array('recursive'=>0,'conditions'=>array('account_id'=>$Account['id'])));

					if($Account['payment_total']>0)
						$payment_to_date+=$Account['payment_total'];
					
				}
				$detail = $trnx['name'];
				$payment = $total_payment;
				if($trnx['amount']<$total_payment){
					$payment = $trnx['amount'];
					$transac_payment -=$payment;
				}
				if(isset($CHECK))
					$payment_to_date += $total_payment;
				else
					$payment_to_date += $payment;
				// Save to reservation

				//Save to ledger
				if($trnx['type']!=='AR'){
					$ledgerItem =  array(
						'account_id'=>$account_id,
						'type'=>'-',
						'transaction_type_id'=>$trnx['id'],
						'esp'=>$ESP,
						'transac_date'=>$today,
						'transac_time'=>$time,
						'ref_no'=>$curr_refNo,
						'details'=>$detail,
						'amount'=>$payment
					);
				}
				if($trnx['type']!=='AR'&&$isCharge){
					
					$ledgerItem['amount']=$total_payment;
					$ledgerItem['details']=$detail.'/'.$isCharge;
				}
				
				if($trnx['type']=='AR'&&$isCharge){
					$charge =  array(
						'account_id'=>$account_id,
						'type'=>'+',
						'transaction_type_id'=>$trnx['id'],
						'esp'=>$ESP,
						'transac_date'=>$today,
						'transac_time'=>$time,
						'ref_no'=>$curr_refNo,
						'details'=>$detail,
						'amount'=>$payment
					);
					array_push($ledger_accounts,$charge);
					$ledgerItem =  array(
						'account_id'=>$account_id,
						'type'=>'-',
						'transaction_type_id'=>$trnx['id'],
						'esp'=>$ESP,
						'transac_date'=>$today,
						'transac_time'=>$time,
						'ref_no'=>$curr_refNo,
						'details'=>$isCharge,
						'amount'=>$total_payment
					);
				}
				
				// save to account histories
				if($trnx['type']!=='AR'){
					$history = array(
						'account_id'=>$account_id,
						'transac_date'=>$today,
						'transac_time'=>$time,
						'ref_no'=>$curr_refNo,
						'details'=>$detail,
						'flag'=>'-',
						'amount'=>$payment
					);
					if($trnx['id']!=='OLDAC'){
						$history['total_due']=$Account['assessment_total'];
						
						$history['total_paid']=$payment_to_date+abs($Account['discount_amount']);
						$history['balance']=($Account['assessment_total']-$Account['discount_amount'])-$payment_to_date;
						$Account['outstanding_balance'] = ($Account['assessment_total']-abs($Account['discount_amount']))-$payment_to_date;
						$Account['payment_total'] = $payment_to_date;
						if(isset($Account['old_balance'])&&$Account['old_balance']>0)
							$Account['outstanding_balance']+=$Account['old_balance'];
					}
				}else{
					$history = array(
						'account_id'=>$account_id,
						'transac_date'=>$today,
						'transac_time'=>$time,
						'ref_no'=>$curr_refNo,
						'details'=>$detail,
						'flag'=>'-',
						'amount'=>$total_payment,
						'total_due'=>0,
						'total_paid'=>0,
						'balance'=>0
					);
				}
				
				
				// save to account transactions
				$acct_transac =  array('account_id'=>$account_id,'transaction_type_id'=>$trnx['id'],'ref_no'=>$curr_refNo,'amount'=>$payment);
				if(isset($CHECK))
					$acct_transac['amount'] = $total_payment;
				// save to transaction details
				$td = array(
					'transaction_id'=>$transac_id,
					'transaction_type_id'=>$trnx['id'],
					'details'=>$detail,
					'amount'=>$total_payment
				);
				if($trnx['type']=='AR'){
					$td['details'] = $trnx['details'];
					$td['amount'] = $total_payment;
				}
				array_push($account_transac,$acct_transac);
				array_push($account_history,$history);
				
				if($trnx['type']!=='AR'){
					array_push($ledger_accounts,$ledgerItem);
				}
				array_push($transac_details,$td);
				if($trnx['id']=='OLDAC')
					$total_payment -= $trnx['amount'];
				if($trnx['type']=='AR')
					$total_payment -= $trnx['amount'];
				
			}
			
			//pr($schedules); exit();
			
			// for account payment schedule
			$sched_payment = $total_payment;
			//pr($sched_payment); exit();
			$account_schedules = array();
			foreach($schedules as $i=>$sched){
				if(isset($sched['AccountSchedule']))
					$sched = $sched['AccountSchedule'];
				if($sched['paid_amount']<$sched['due_amount']){
					$payment_required = $sched['due_amount']-$sched['paid_amount'];
					if($payment_required<=$sched_payment){
						$sched_payment-=$payment_required;
						$sched['status'] = 'PAID';
						$sched['paid_amount'] = $payment_required+$sched['paid_amount'];
					}else{
						$sched['paid_amount'] = $sched_payment+$sched['paid_amount'];
						$sched_payment = 0;
					}
					$sched['paid_date'] = $today;
					
					array_push($account_schedules,$sched);
					//pr($sched);
				}
				if($sched_payment==0)
					break;
			}
			
			
			// For account fees
			
			$account_fees = array();
			$fee_payment = $total_payment;
			$total_feePaid = 0;
			$total_misc = 0;
			foreach($fees as $i=>$fee){
				if(isset($fee['AccountFee']))
					$fee = $fee['AccountFee'];
				$total_feePaid += $fee['paid_amount'];
				if($fee['fee_id']!='TUI')
					$total_misc += $fee['due_amount'];
			}
			
			if(($total_feePaid+$total_payment)>$total_misc){
				$Account['rounding_off'] = 0;
				foreach($fees as $i=>$fee){
					$fee = $fee['AccountFee'];
					if($fee['fee_id']=='TUI'&&$fee['paid_amount']>0){
						if($fee_payment>$fee['due_amount'])
							$payment = $total_payment-$fee['due_amount'];
						else{
							$payment=$fee_payment;
							$fee_payment = 0;
						}
						$fee['paid_amount'] += $payment;
					}else{
						$fee['paid_amount'] = $fee['due_amount'];
						if($fee['fee_id']=='TUI')
							$fee['paid_amount'] = ($total_feePaid+$total_payment)-$total_misc;
						
					}
					
					array_push($account_fees,$fee);
				}
			}else{
				$round_off = 0;
				foreach($fees as $i=>$fee){
					$fee = $fee['AccountFee'];
					if($fee['fee_id']=='TUI')
						continue;
					$fee['paid_amount'] = ($total_feePaid+$total_payment) * $fee['percentage'];
					$round_off += $fee['paid_amount'];
					array_push($account_fees,$fee);
				}
				$Account['rounding_off'] = $Account['payment_total']-$round_off;
			}
			
			
			$DataCollection = array(
				'TransactionPayment'=>$transac_payments,
				'TransactionDetail'=>$transac_details,
				'AccountTransaction'=>$account_transac,
				'Ledger'=>$ledger_accounts,
				'AccountHistory'=>$account_history,
				'AccountSchedule'=>$account_schedules,
				'AccountFee'=>$account_fees,
				'Account'=>$Account,
				'Booklet'=>$booklet
			);
			$DataCollection['Account']['transaction_id']  = $transac_id;
			foreach($DataCollection as $model=>$collection){
				//pr($collection); continue;
				if($collection){
					if($this->$model->saveAll($collection)){
						$this->Session->setFlash(__('The '. $i .' has been saved', true));
					}
					else{
						$this->Session->setFlash(__('Error saving '.$i, true));
						break;
					}
				}
			}
			$this->data['Payment'] = array('transaction_id'=>$transac_id);
			if($booklet['status'] == 'CONSM')
				$this->data['Payment'] = array('transaction_id'=>$transac_id,'booklet'=>'Consumed');
			$this->set(compact('payments'));
			
		}
	}
	
	function SaveOthers($data){
		//pr($data); exit();
		$today = date("Y-m-d");
		$time = date("h:i:s");
		$booklet = $data['Booklet'];
		$n = 0;
		//pr($data); exit();
		if(isset($data['Student']['id'])){
			if($data['Student']['account_type']=='others'){
				$account = $data['Student'];
				$account['payment_total'] += $data['Cashier']['total_due'];
				$account_id = $data['Student']['id'];
				$this->Account->save($account);
			}else{
				$levels = $this->YearLevel->find('all');
				$lvls = array();
				foreach($levels as $lvl){
					array_push($lvls,$lvl['YearLevel']['id']);
				}
				foreach($lvls as $i=>$l){
					if($data['Student']['year_level_id']==$l){
						$res['year_level_id'] = $lvls[$i+1];
					}
				}
				//pr($res); exit();
				if($res['year_level_id']=='GY')
					$res['program_id']='MIXED';
				if(isset($data['Student']['program_id']))
					$res['program_id']=$data['Student']['program_id'];
				$res['account_id'] = $data['Student']['id'];
				$res['esp'] = $data['Cashier']['esp']+1;
				$res['field_type'] = $data['Transaction'][0]['id'];
				$res['ref_no'] = 'OR '.$booklet['series_counter'];
				$res['amount'] = $data['Cashier']['total_due'];
				$res['transac_date'] = $today;
				$this->Reservation->save($res);
				$account_id = $data['Student']['id'];
			}
		}
		else{
			do{
				$n2 = str_pad($n+1, 5, 0, STR_PAD_LEFT);
				$result = $this->Account->find('all',array('recursive'=>0,'conditions'=>array('Account.id'=>'LSO'.$n2)));
				$n++;
			}
			while(!empty($result));
			$account_id = 'LSO'.$n2;
			$acct_data = array(
				'id'=>$account_id,
				'account_type'=>'others',
				'account_details'=>$data['Student']['name'],
				'assessment_total'=> 0,
				'subsidy_status'=>'REGXX',
				'discount_amount'=>0,
				'payment_total'=>$data['Cashier']['total_due'],
				'outstanding_balance'=>0,
				'rounding_off'=>0,
			);
			
			$this->Account->saveAll($acct_data);
		}
			$transac_data = array(
							'type'=>'payment',
							'status'=>'fulfilled',
							'booklet_id'=>$booklet['id'],
							'ref_no'=>'OR '.$booklet['series_counter'],
							'account_details'=>$data['Student']['name'],
							'esp' => $data['Cashier']['esp'],
							'amount'=> $data['Cashier']['total_due'],
							'transac_date'=>$today,
							'transac_time'=>$time,
							'cashier'=>$this->Auth->user()['User']['username'],
							'account_id'=>$account_id);
			$this->Transaction->saveAll($transac_data);
			$transac_id = $this->Transaction->id;
			
			
		
		$tr_details = array();
		
		foreach($data['Transaction'] as $i=>$trnx){
			
			$td = array(
				'transaction_id'=>$transac_id,
				'transaction_type_id'=>$trnx['id'],
				'amount'=>$data['Cashier']['total_due']
			);
			if(isset($trnx['details']))
				$td['details'] = $trnx['details'];
			else
				$td['details'] = $trnx['name'];
			//pr($td); exit();
			array_push($tr_details,$td);
		}
		
		$tr_payments = array();
		
		foreach($data['Payment'] as $i=>$pay){
			$tp = array('transaction_id'=>$transac_id,'payment_method_id'=>$pay['id'],'amount'=>$pay['amount']);
			if($pay['id']!=='CASH'){
				$tp['valid_on']=$pay['date'];
				$tp['details']=$pay['bank'];
				$isCharge = $pay['bank'];
			}
			else
				$tp['details']='Cash';
			array_push($tr_payments,$tp);
		}
		$booklet = $this->checkBooklet($data);
		//$booklet['series_counter']++;
		$DataCollection = array(
			'TransactionPayment'=>$tr_payments,
			'TransactionDetail'=>$tr_details,
			'Booklet'=>$booklet,
		);
		//pr($DataCollection); exit();
		foreach($DataCollection as $model=>$collection){
			if($collection){
				if($this->$model->saveAll($collection)){
					$this->Session->setFlash(__('The '. $model .' has been saved', true));
				}
				else{
					$this->Session->setFlash(__('Error saving '.$model, true));
					break;
				}
			}
		}
		
		$this->data['Payment'] = array('transaction_id'=>$transac_id);
		if($booklet['status'] == 'CONSM')
			$this->data['Payment'] = array('transaction_id'=>$transac_id,'booklet'=>'Consumed');
		$this->set(compact('payments'));
	}

	function SaveInquiry($data){
		//pr($data); exit();
		$account_id = $data['Student']['id'];
		$today = date("Y-m-d");
		$time = date("h:i:s");
		$booklet = $data['Booklet'];
		
		$docType = $this->data['Type']['type'];
		$refNoType =  $docType;
		if($docType=='A2O'){
			$refNoType =  'OR';
		}
		$transac_data = array(
						'type'=>'payment',
						'status'=>'fulfilled',
						'booklet_id'=>$booklet['id'],
						'ref_no'=>$refNoType.' '.$booklet['series_counter'],
						'account_details'=>$data['Student']['name'],
						'esp' => $data['Cashier']['esp'],
						'amount'=> $data['Cashier']['total_due'],
						'transac_date'=>$today,
						'transac_time'=>$time,
						'cashier'=>$this->Auth->user()['User']['username'],
						'account_id'=>$account_id);
		$this->Transaction->saveAll($transac_data);
		$transac_id = $this->Transaction->id;
		
		
		$tr_details = array();
		
		foreach($data['Transaction'] as $i=>$trnx){
			$td = array(
				'transaction_id'=>$transac_id,
				'transaction_type_id'=>$trnx['id'],
				'details'=>$trnx['name'],
				'amount'=>$trnx['amount']
			);
			
			if($trnx['id']=='RSRVE'||$trnx['id']=='ADVTP'){
				$nextESP = $data['Cashier']['esp']+1;
				$rsrveObj =  array(
					'account_id'=>$account_id,
					'esp'=>$nextESP,
					'field_type'=>$trnx['id'],
					'year_level_id'=>$data['Student']['year_level'],
					'ref_no'=>$transac_data['ref_no'],
					'amount'=>$trnx['amount'],
					'transac_date'=>$today
				);
				$this->Reservation->save($rsrveObj);
			}
			array_push($tr_details,$td);
		}
		
		$tr_payments = array();
		
		foreach($data['Payment'] as $i=>$pay){
			$tp = array('transaction_id'=>$transac_id,'payment_method_id'=>$pay['id'],'amount'=>$pay['amount']);
			if($pay['id']!=='CASH'){
				$tp['valid_on']=$pay['date'];
				$tp['details']=$pay['bank'];
				$isCharge = $pay['bank'];
			}
			else
				$tp['details']='Cash';
			array_push($tr_payments,$tp);
		}
		$booklet = $this->checkBooklet($data);
		//$booklet['series_counter']++;
		$DataCollection = array(
			'TransactionPayment'=>$tr_payments,
			'TransactionDetail'=>$tr_details,
			'Booklet'=>$booklet,
		);
		//pr($DataCollection); exit();
		foreach($DataCollection as $model=>$collection){
			if($collection){
				if($this->$model->saveAll($collection)){
					$this->Session->setFlash(__('The '. $model .' has been saved', true));
				}
				else{
					$this->Session->setFlash(__('Error saving '.$model, true));
					break;
				}
			}
		}
		
		$this->data['Payment'] = array('transaction_id'=>$transac_id);
		if($booklet['status'] == 'CONSM')
			$this->data['Payment'] = array('transaction_id'=>$transac_id,'booklet'=>'Consumed');
		$this->set(compact('payments'));
	}

	
	
	function checkBooklet($data){
		$booklet = $data['Booklet'];
		//pr($booklet); exit();
		if($booklet['series_counter']<$booklet['series_end']){
			if(isset($booklet['mark'])){
				if($booklet['mark']=='bypass'){
					$booklet['series_counter']=$booklet['InitialCtr'];
				}else{
					$series=$booklet['series_counter']+1;
					do{
					$result = $this->Ledger->find('first',array('recursive'=>0,'conditions'=>array('Ledger.ref_no'=>'OR '.$series)));
						$series++;
					}while(!empty($result));
					$series--;
					$booklet['series_counter'] = $series;
				}
			}else{
				$series=$booklet['series_counter']+1;
				do{
				$result = $this->Ledger->find('first',array('recursive'=>0,'conditions'=>array('Ledger.ref_no'=>'OR '.$series)));
					$series++;
				}while(!empty($result));
				$series--;
				$booklet['series_counter'] = $series;
			}
		}else
			$booklet['status'] = 'CONSM';
		return $booklet;
	}
	
	function creatNewAccount($acc){
		
	}
	
	function createStudent($all_info){
		//pr($all_info);
		if(isset($all_info['StudInfo']))
			$data = $all_info['StudInfo'];
		//pr($data);
		$ass = $all_info['Assessment'];
		$data['status'] = 'NROLD';
		$ass['status'] = 'NROLD';
		$assessment_data = $ass;
		$this->Assessment->saveAll($assessment_data);
		//pr($data); exit();
		if($ass['student_status']=='New'){
			$this->Inquiry->saveAll($data);
			$hs = array('G7','G8','G9','GX');
			if(in_array($data['year_level_id'],$hs))
				$data['id'] = $this->Student->generateSID('LS','J');
			else
				$data['id'] = $this->Student->generateSID('LS','S');
			
			$ass['id'] = $data['id'];
			$this->Student->saveAll($data);
		}else{
			$account = $this->Account->findById($ass['student_id']);
			$account = $account['Account'];
			$ass['id'] = $ass['student_id'];
			$ass['outstanding_balance'] += $account['outstanding_balance'];
			
		}
		$this->Account->saveAll($ass);
		$paysched = array();
		$fees = array();
		foreach($ass['Paysched'] as $i=>$ps){
			$ps['account_id'] = $ass['id'];
			array_push($paysched,$ps);
		}
		foreach($ass['Fee'] as $i=>$f){
			$f['account_id'] = $ass['id'];
			array_push($fees,$f);
		}
		$this->AccountSchedule->saveAll($paysched);
		$this->AccountFee->saveAll($fees);
		return $ass;
	}
	
}