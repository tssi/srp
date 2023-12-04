<?php
class Billing extends AppModel {
	var $name = 'Billing';
	var $belongsTo = array(
		'Account' => array(
			'className' => 'Account',
			'foreignKey' => 'account_id',
			'conditions' => '',
			'fields' => '',
			'order' => ''
		)
     );

     function generateREFNO($sy,$prefix=null){
		$REFNO_SERIES = 0;
		$syID =  substr($sy.'', -2);
		$REFNO_PREFIX = sprintf('%s%s',$prefix,$syID);
		$cond =  array('Billing.id LIKE'=>$REFNO_PREFIX.'%');
		$this->recursive=-1;
		
		$billObj = $this->find('first',array('conditions'=>$cond,'order'=>array('id'=>'desc')));
		if($billObj):
			$REFNO_SERIES =  (int)(str_replace($REFNO_PREFIX, '', $billObj['Billing']['id']));
		endif;
		$REFNO = $REFNO_PREFIX .str_pad($REFNO_SERIES+1, 6, 0, STR_PAD_LEFT);
		
		return $REFNO;
	}

    function checkAccount(&$account){
        $dueNow  =$account['due_now'];
        $hashObj = $this->checkHashObj($account['id'], $dueNow['date'], $dueNow['amount']);
        $hasID = isset($hashObj['id']);
        
        if(!$hasID){
        	$sy  =floor($account['esp']);
            $BNO = $this->generateREFNO($sy,'LSB');
            $hashObj['id']=$BNO;
            $this->create();
            $this->save($hashObj);
        }
        
        $account['billing_no'] =  $hashObj['id'];	
    }
    protected function checkHashObj($account_id,$date,$amount){
        $hashObj  =  $this->generateHash($account_id,$date,$amount);
        
        $billObj = $this->find('first',array('conditions'=>array('hash'=>$hashObj['hash'])));
        
        if($billObj)
        	$hashObj['id'] = $billObj['Billing']['id'];
        return $hashObj;
    }
    protected function generateHash($account_id,$date,$amount){
        $dateStr =  date('Y-m-d',strtotime($date));
        $amountNum  = floatval(str_replace(',', '', $amount));
        $text = sprintf('%s-%s-%s',$account_id,$dateStr,$amountNum);

        $hash =  md5($text);
        $hashObj = array(
        	'account_id'=>$account_id,
        	'due_date'=>$dateStr,
        	'due_amount'=>$amountNum,
        	'hash'=>$hash
        );
        return $hashObj;
    }
}