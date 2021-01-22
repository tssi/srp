<?php
class BookletsController extends AppController {

	var $name = 'Booklets';

	function index() {
		$this->Booklet->recursive = 0;
		$this->set('booklets', $this->paginate());
	}

	function view($id = null) {
		if (!$id) {
			$this->Session->setFlash(__('Invalid booklet', true));
			$this->redirect(array('action' => 'index'));
		}
		$this->set('booklet', $this->Booklet->read(null, $id));
	}

	function add() {
		if (!empty($this->data)) {
			//pr($this->data); exit();
			$booklet = $this->data['Booklet'];
			$this->Booklet->create();
			if(isset($booklet['label'])){
				$data = $this->data['Booklet'];
			}else{
				
				if(isset($this->data['Cashier']))
					$cashier = $this->data['Cashier'];
				$data = array();
				foreach($booklet as $i=>$b){
					if(!isset($this->data['Cashier'])){
						$b['cashier_id'] = null;
						$b['cashier'] = 'unassigned';
					}else{
						
						$b['cashier_id'] = $cashier['id'];
						$b['cashier'] = $cashier['employee_name'];
					}
					if(!isset($this->data['Cashier']))
						$b['status'] = 'UNASS';
					else
						$b['status'] = 'ASSGN';
					$b['receipt_type'] = $b['doctype'];
					$data[$i] = $b;
				}
			}
			$success = $this->Booklet->saveAll($data);
			//exit();
			if ($success) {
				$this->Session->setFlash(__('The booklet has been saved', true));
				$this->redirect(array('action' => 'index'));
			} else {
				$this->Session->setFlash(__('The booklet could not be saved. Please, try again.', true));
			}
		}
	}

	function edit($id = null) {
		if (!$id && empty($this->data)) {
			$this->Session->setFlash(__('Invalid booklet', true));
			$this->redirect(array('action' => 'index'));
		}
		if (!empty($this->data)) {
			if ($this->Booklet->save($this->data)) {
				$this->Session->setFlash(__('The booklet has been saved', true));
				$this->redirect(array('action' => 'index'));
			} else {
				$this->Session->setFlash(__('The booklet could not be saved. Please, try again.', true));
			}
		}
		if (empty($this->data)) {
			$this->data = $this->Booklet->read(null, $id);
		}
	}

	function delete($id = null) {
		if (!$id) {
			$this->Session->setFlash(__('Invalid id for booklet', true));
			$this->redirect(array('action'=>'index'));
		}
		if ($this->Booklet->delete($id)) {
			$this->Session->setFlash(__('Booklet deleted', true));
			$this->redirect(array('action'=>'index'));
		}
		$this->Session->setFlash(__('Booklet was not deleted', true));
		$this->redirect(array('action' => 'index'));
	}
}
