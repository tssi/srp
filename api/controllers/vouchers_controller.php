<?php
class VouchersController extends AppController {

	var $name = 'Vouchers';

	function index() {
		$this->Voucher->recursive = 0;
		$vouchers =  $this->paginate();
		if($this->isAPIRequest()){
			foreach($vouchers as $i=>$v){
				//pr($v);
				$vouch = $v['Voucher'];
				$student = $v['Account']['Student'];
				$data['account_id'] = $vouch['account_id'];
				$data['voucher_no'] = $vouch['voucher_no'];
				$data['sno'] = $student['sno'];
				$data['student'] = $student['full_name'];
				$data['issue_date'] = $vouch['issue_date'];
				$data['amount'] = $vouch['amount'];
				switch($vouch['status']){
					case 'RECVD'; $data['status'] = 'Received'; break;
					case 'FUNDD'; $data['status'] = 'Funded'; break;
					case 'DNIED'; $data['status'] = 'Denied'; break;
				}
				$vouchers[$i]['Voucher'] = $data;
			}
		}
		//exit();
		
		$this->set('vouchers',$vouchers);
	}

	function view($id = null) {
		if (!$id) {
			$this->Session->setFlash(__('Invalid account', true));
			$this->redirect(array('action' => 'index'));
		}
		$this->set('account', $this->Voucher->read(null, $id));
	}

	function add() {
		if (!empty($this->data)) {
			$this->Voucher->create();
			if ($this->Voucher->save($this->data)) {
				$this->Session->setFlash(__('The account has been saved', true));
				$this->redirect(array('action' => 'index'));
			} else {
				$this->Session->setFlash(__('The account could not be saved. Please, try again.', true));
			}
		}
	}

	function edit($id = null) {
		if (!$id && empty($this->data)) {
			$this->Session->setFlash(__('Invalid account', true));
			$this->redirect(array('action' => 'index'));
		}
		if (!empty($this->data)) {
			if ($this->Voucher->save($this->data)) {
				$this->Session->setFlash(__('The account has been saved', true));
				$this->redirect(array('action' => 'index'));
			} else {
				$this->Session->setFlash(__('The account could not be saved. Please, try again.', true));
			}
		}
		if (empty($this->data)) {
			$this->data = $this->Voucher->read(null, $id);
		}
	}

	function delete($id = null) {
		if (!$id) {
			$this->Session->setFlash(__('Invalid id for account', true));
			$this->redirect(array('action'=>'index'));
		}
		if ($this->Voucher->delete($id)) {
			$this->Session->setFlash(__('Account deleted', true));
			$this->redirect(array('action'=>'index'));
		}
		$this->Session->setFlash(__('Account was not deleted', true));
		$this->redirect(array('action' => 'index'));
	}
}
