<?php
/* Transactions Test cases generated on: 2016-02-29 08:23:49 : 1456730629*/
App::import('Controller', 'Transactions');

class TestTransactionsController extends TransactionsController {
	var $autoRender = false;

	function redirect($url, $status = null, $exit = true) {
		$this->redirectUrl = $url;
	}
}

class TransactionsControllerTestCase extends CakeTestCase {
	var $fixtures = array('app.transaction', 'app.account', 'app.account_adjustment', 'app.account_fee', 'app.fee', 'app.account_history', 'app.account_schedule', 'app.ledger', 'app.transaction_detail', 'app.transaction_payment', 'app.transaction_type');

	function startTest() {
		$this->Transactions =& new TestTransactionsController();
		$this->Transactions->constructClasses();
	}

	function endTest() {
		unset($this->Transactions);
		ClassRegistry::flush();
	}

	function testIndex() {

	}

	function testView() {

	}

	function testAdd() {

	}

	function testEdit() {

	}

	function testDelete() {

	}

}
