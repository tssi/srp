<?php
class ReceiptsController extends AppController{
	var $name = 'Receipts';
	var $uses = array('MasterConfig','Student');
	function view($id=null){
		if($id=='payment_plan'):
			$this->payment_plan();
		else:
			$this->adjust_memo();
		endif;
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
	protected function payment_plan(){
		$this->render('payment_plan');
		return;
	}
}