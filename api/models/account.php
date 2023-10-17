<?php
class Account extends AppModel {
	var $name = 'Account';
	//var $useDbConfig = 'sfm';
	//The Associations below have been created with all possible keys, those that are not needed can be removed
	var $belongsTo = array(
		'Student' => array(
			'className' => 'Student',
			'foreignKey' => 'id',
			'dependent' => false,
			'conditions' => '',
			'fields' => '',
			'order' => '',
			'limit' => '',
			'offset' => '',
			'exclusive' => '',
			'finderQuery' => '',
			'counterQuery' => ''
		),
		'Inquiry' => array(
			'className' => 'Inquiry',
			'foreignKey' => 'id',
			'dependent' => false,
			'conditions' => '',
			'fields' => array(
				'Inquiry.id',
				'Inquiry.gender',
				'Inquiry.short_name',
				'Inquiry.full_name',
				'Inquiry.first_name',
				'Inquiry.last_name',
				'Inquiry.class_name',
				'Inquiry.year_level_id',
				'Inquiry.program_id'
			),
			'order' => '',
			'limit' => '',
			'offset' => '',
			'exclusive' => '',
			'finderQuery' => '',
			'counterQuery' => ''
		),
	);
	var $hasMany = array(
		'AccountAdjustment' => array(
			'className' => 'AccountAdjustment',
			'foreignKey' => 'account_id',
			'dependent' => false,
			'conditions' => '',
			'fields' => '',
			'order' => '',
			'limit' => '',
			'offset' => '',
			'exclusive' => '',
			'finderQuery' => '',
			'counterQuery' => ''
		),
		'AccountFee' => array(
			'className' => 'AccountFee',
			'foreignKey' => 'account_id',
			'dependent' => false,
			'conditions' => '',
			'fields' => '',
			'order' => '',
			'limit' => '',
			'offset' => '',
			'exclusive' => '',
			'finderQuery' => '',
			'counterQuery' => ''
		),
		'AccountHistory' => array(
			'className' => 'AccountHistory',
			'foreignKey' => 'account_id',
			'dependent' => false,
			'conditions' => '',
			'fields' => '',
			'order' => '',
			'limit' => '',
			'offset' => '',
			'exclusive' => '',
			'finderQuery' => '',
			'counterQuery' => ''
		),
		'AccountSchedule' => array(
			'className' => 'AccountSchedule',
			'foreignKey' => 'account_id',
			'dependent' => false,
			'conditions' => '',
			'fields' => '',
			'order' => '',
			'limit' => '',
			'offset' => '',
			'exclusive' => '',
			'finderQuery' => '',
			'counterQuery' => ''
		),
		'Ledger' => array(
			'className' => 'Ledger',
			'foreignKey' => 'account_id',
			'dependent' => false,
			'conditions' => '',
			'fields' => '',
			'order' => '',
			'limit' => '',
			'offset' => '',
			'exclusive' => '',
			'finderQuery' => '',
			'counterQuery' => ''
		),
		'AccountTransaction' => array(
			'className' => 'AccountTransaction',
			'foreignKey' => 'account_id',
			'dependent' => false,
			'conditions' => '',
			'fields' => '',
			'order' => '',
			'limit' => '',
			'offset' => '',
			'exclusive' => '',
			'finderQuery' => '',
			'counterQuery' => ''
		)
	);
	function beforeFind($queryData){
		//pr($queryData); exit();
		if($conds=$queryData['conditions']){
			foreach($conds as $i=>$cond){
				if(!is_array($cond))
					break;
				$keys =  array_keys($cond);
				
				$search = ['Account.name LIKE','Account.first_name LIKE','Account.middle_name','Account.last_name'];
			
				if(in_array($search[1],$keys)){
					$val = array_values($cond);
					$account_type = 'student';
					if(isset($_GET['account_type'])){
						$account_type = $_GET['account_type'];
					}
					if($account_type=='student')
						$students = $this->Student->findByName($val[1]);
					else if($account_type=='inquiry')
						$students = $this->Inquiry->findByName($val[1]);
					$student_ids= array_keys($students);
					unset($cond['Account.first_name LIKE']);
					unset($cond['Account.middle_name LIKE']);
					unset($cond['Account.last_name LIKE']);
					unset($cond['Account.name LIKE']);
					unset($cond['Account.id LIKE']);
					$cond['Account.id']=$student_ids;
				}
				
				$conds[$i]=$cond;
			}
			//pr($conds);exit();
			$queryData['conditions']=$conds;
		}
		
		return $queryData;
	}

	function postTransaction($account_id, $trnx){
		$A = $this->findById($account_id);
		// Update account balances and totals
		$ACC = $A['Account'];
		if($trnx['flag']=='-'):
			$amount =  $trnx['amount'];
			$ACC['outstanding_balance'] -= $amount; 
			$ACC['payment_total'] += $amount; 
			
			// Account
			$ACD = array();
			$ACD['id'] =  $ACC['id'];
			$ACD['outstanding_balance'] =  $ACC['outstanding_balance'];
			$ACD['payment_total'] =  $ACC['payment_total'];
			$this->save($ACD);

			// Account History
			$ACH = array();
			$ACH['account_id'] = $ACC['id'];
			$ACH['total_due'] =  $ACC['assessment_total'];
			$ACH['total_paid'] =  $ACC['payment_total'];
			$ACH['balance'] =  $ACC['outstanding_balance'];
			$ACH['transac_date'] =  $trnx['transac_date'];
			$ACH['transac_time'] =  date('h:i:s',time());
			$ACH['amount'] =  $amount;
			$ACH['ref_no'] =  $trnx['ref_no'];
			$ACH['details'] =  $trnx['details'];
			$ACH['flag'] =  $trnx['flag'];
			$this->AccountHistory->save($ACH);

			// Account Fees
			$ACF = array();
			foreach($A['AccountFee'] as $AF):
				if($AF['fee_id']=='TUI'):
					$AF['paid_amount'] = $ACC['payment_total'];
					$this->AccountFee->save($AF);
				endif;
			endforeach;

			// Account Transaction
			$ACT = array();
			$ACT['account_id']= $ACC['id'];
			$ACT['transaction_type_id']= $trnx['transaction_type_id'];
			$ACT['ref_no']= $trnx['ref_no'];
			$ACT['amount']= $trnx['amount'];
			$this->AccountTransaction->save($ACT);
		endif;
	}

	function udpateEspSource($sy){
		$this->setSource('accounts_'.$sy);
		$this->AccountSchedule->setSource('account_schedules_'.$sy);
	}

}
