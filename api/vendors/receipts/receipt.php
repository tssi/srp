<?php
require('vendors/fpdf17/formsheet.php');
class OfficialReceipt extends Formsheet{
	protected static $_width = 4.25;
	protected static $_height = 6.7;
	protected static $_unit = 'in';
	protected static $_orient = 'P';	
	protected static $curr_page = 1;
	protected static $page_count;
	
	function OfficialReceipt(){
		$this->showLines = !true;
		$this->FPDF(OfficialReceipt::$_orient, OfficialReceipt::$_unit,array(OfficialReceipt::$_width,OfficialReceipt::$_height));
		$this->createSheet();
	}
	
	function receipt(){
		$this->showLines = !true;
		$metrics = array(
			'base_x'=> 0,
			'base_y'=> 0,
			'width'=> 4.25,
			'height'=> 6.7,
			'cols'=> 38,
			'rows'=> 62,	
		);
		$this->section($metrics);
		//$this->DrawImage(0,0,4.25,6.4,__DIR__ ."/../images/receipt-clean.jpg");
	}
	
	
	function data($data){
		$this->showLines = !true;
		$metrics = array(
			'base_x'=> 0,
			'base_y'=> 0,
			'width'=> 4.25,
			'height'=> 6.7,
			'cols'=> 22,
			'rows'=> 34,	
		);
		$this->section($metrics);
	
		$y=1;
		$this->GRID['font_size']=10;
		//$this->SetTextColor(78,68,66);
		$this->rightText(15.8,4,'','','');
		$this->SetTextColor(231,31,54);
		$this->rightText(20.5,4,substr($data['ref_no'], 2),'','');
		
		$this->SetTextColor(44,39,41);
		$this->GRID['font_size']=9;
		
		//Date
		$this->leftText(14.2,7,$data['transac_date'],'','');
		//Student No.
		$this->leftText(8,7,$data['sno'],'','');
		//Receive payment from
		$this->leftText(6,8.7,$data['student'],'','');
		//Payment for
		$this->leftText(8,10.25,$data['sy'],'','');
		//Year
		$this->leftText(15,10.05,$data['year_level'].' / ','','');
		//Section
		$this->leftText(15,10.75,$data['section'],'','');
		
		
		$y=11.7;
		$this->GRID['font_size']=9;
		foreach($data['transac_details'] as $itm){
			//pr($itm);exit;
			$this->rightText(15,$y,'','','');
			$this->rightText(15,$y,$itm['item'],'','');

			$this->rightText(20,$y,$itm['amount'],'','');
			$y++;
		}
		
		
		
		//Total
		$this->rightText(20,26.3,$data['total_paid'],'','');
		
		//Cashier
		$this->centerText(13,28.3,$data['cashier'],7,'');
		
	
		
		

		$y++;
	
	}
	
}
?>
	