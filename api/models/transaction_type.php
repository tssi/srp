<?php
class TransactionType extends AppModel {
	var $name = 'TransactionType';
	var $consumableFields = array('id','name','amount','token','fees','amounts');
	var $virtualFields = array(
				'token'=>'MD5(CONCAT(AccountTransaction.id,TransactionType.id))',
				'amount'=>'CASE WHEN AccountTransaction.total_amount THEN  AccountTransaction.total_amount ELSE TransactionType.default_amount END',
				'fees'=>'AccountTransaction.breakdown_codes',
				'amounts'=>'AccountTransaction.breakdown_amounts',
				);
	//var $useDbConfig = 'sfm';
	var $actsAs = array('Containable');
	//The Associations below have been created with all possible keys, those that are not needed can be removed
	var $hasMany = array(
		'TransactionPayment' => array(
			'className' => 'TransactionPayment',
			'foreignKey' => 'transaction_type_id',
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
	var $hasOne = array(
		'AccountTransaction'=> array(
			'className' => 'AccountTransaction',
			'foreignKey' => 'transaction_type_id',
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
	);
	function beforeFind($queryData){
		return $this->sanitizeQuery($queryData);
	}
	function preparePagination($pagination){
		$queryData = $pagination['TransactionType'];
		return array('TransactionType'=>$this->sanitizeQuery($queryData));
	}
	protected function sanitizeQuery($queryData){
		$delimiter = null;
		if(isset($queryData['conditions'][0])){
			foreach($queryData['conditions'] as $i=>$condition){
				foreach($condition as $cond=>$value){
					if(preg_match('/account_id/',$cond)){
						unset($queryData['conditions'][$i][$cond]);
						$delimiter = $value;
					}
				}
			}
		}
		$queryData['contain']=array(
						'AccountTransaction' => array(
							'conditions' => array(
								'AccountTransaction.account_id' => $delimiter
							)
						)
					);
		if(isset($queryData['conditions'])){
			if(is_array($queryData['conditions'])){
				$conditions= array('OR'=>array(
									array('TransactionType.type'=>'active'),
									array('TransactionType.type'=>'reactive','TransactionType.amount >'=>0),
									array('TransactionType.type'=>'passive','AccountTransaction.id'=>null)
									)
				);
				array_push($queryData['conditions'],$conditions);
			}
		}
		return $queryData;
	}

}
