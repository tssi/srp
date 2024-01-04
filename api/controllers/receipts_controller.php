<?php
class ReceiptsController extends AppController{
	var $name = 'Receipts';
	var $uses = array('MasterConfig','Student');
	function view($id=null){
		$this->adjust_memo();
	}

	protected function adjust_memo(){
		if(isset($_POST['details'])):

			$details = json_decode($_POST['details'],true);
			$user = $this->Auth->user()['User'];
			$details['cashier']=$user['username'];
			// Transform  SY format
			$details['sy'] = (int)$details['sy'];
			$details['sy'] = sprintf("SY %s-%s",$details['sy'],$details['sy']+1);
			$data = $details;
		else:
			$refNo= $trnDate= $student= $sno= $yearLevel= $section= $syFor="XXX";
			$trnDate=  $totalPaid = $cashier= $verify ="XX";
			$trnxDtls = array(
				array('item'=>'XXX','amount'=>'XXX.XX')
			);
			$data = array(
					'ref_no'=>$refNo,
					'transac_date'=>$trnDate,
					'student'=>$student,
					'sno'=>$sno,
					'year_level'=>$yearLevel,
					'section'=>$section,
					'sy'=>$syFor,
					'transac_details'=> $trnxDtls,
					'total_paid'=>$totalPaid,
					'cashier'=>$cashier,
					'verify_sign'=>'1A2khsfdso1sa'
				);
		endif;

		
		/*
		Array
		(
		    [ref_no] => OR 133329
		    [transac_date] => 21 Aug 2023
		    [student] => Santos, Ysmael Zeth Cyrus Marcellana
		    [sno] => 2023-0085  
		    [year_level] => Gr 7
		    [section] => CHARITY
		    [sy] => 23-24
		    [transac_details] => Array
		        (
		            [0] => Array
		                (
		                    [item] => Subsequent Payment
		                    [amount] => 425.00
		                )

		        )

		    [total_paid] => 425.00
		    [cashier] => admin
		    [verify_sign] => 7c00f733dab1f0c886b14ae5dae7f8ff
		)
		*/
		
		$this->set(compact('data'));
		$this->render('adjust_memo');
	}
	function payment_plan(){
		$details = json_decode($_POST['details'],true);

		$sid = $details['account_id'];
		$this->Student->recursive=-1;
		$stud = $this->Student->findById($sid);
		$details['student']=$stud['Student']['full_name'];
		$details['date_created'] = date('F d, Y',time());
		$this->set(compact('details'));
		$this->render('payment_plan');
		return;
	}

	function cash_ar(){
		$details = json_decode($_POST['details'],true);

		$sid = $details['account_id'];
		$this->Student->recursive=-1;
		$stud = $this->Student->findById($sid);
		$details['student']=$stud['Student']['full_name'];
		$details['transac_date'] = date('d M Y',strtotime($details['transac_date']));
		$user = $this->Auth->user()['User'];
		$details['cashier']=$user['username'];
		$this->set(compact('details'));
		$this->render('cash_ar');
		return;	
	}

	function cash_a2o(){
		$details = json_decode($_POST['details'],true);

		$sid = $details['account_id'];
		$this->Student->recursive=-1;
		$stud = $this->Student->findById($sid);
		$details['student']=$stud['Student']['full_name'];
		$details['transac_date'] = date('d M Y',strtotime($details['transac_date']));
		$user = $this->Auth->user()['User'];
		$details['cashier']=$user['username'];

		
		$trnxDtls  =array();
		foreach($details['details'] as $dtl){
			$item = $dtl['description'];
			$amount= number_format($dtl['amount'],2,'.',',');
			$trnxDtls[] =  array('item'=>$item,'amount'=>$amount);
		}
		$or_details = array(
			'ref_no'=>$details['series_no'],
			'transac_date'=>$details['transac_date'],
			'student'=>$details['student'],
			'sno'=>'',
			'year_level'=>'',
			'section'=>'',
			'sy'=>$details['esp'],
			'transac_details'=> $trnxDtls,
			'total_paid'=>$details['pay_amount'],
			'cashier'=>$user['username']
		);
		$this->set(compact('details','or_details'));
		$this->render('cash_a2o');
		return;	
	}
}