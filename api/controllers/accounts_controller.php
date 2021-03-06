<?php
class AccountsController extends AppController {

	var $name = 'Accounts';

	function index() {
		$this->Account->recursive = 0;
		$accounts =  $this->paginate();
		
		if($this->isAPIRequest()){
			$yrLevels = $this->Account->Student->YearLevel->find('list',array('fields'=>array('id','description')));
			$sections = $this->Account->Student->YearLevel->Section->find('list',array('fields'=>array('id','description')));

			foreach($accounts as $i =>$acc){
				$stud =  $acc['Student'];
				$inqu =  $acc['Inquiry'];
				//pr($stud);
				if(isset($stud['sno'])){
					$yrlvId =  $acc['Student']['year_level_id'];
					$sectId =  $acc['Student']['section_id'];
					$yearLevel = "";
					$section = "";
				
					if(isset($yrLevels[$yrlvId]))
						$yearLevel = $yrLevels[$yrlvId];
					if(isset($sections[$sectId]))
						$section = $sections[$sectId];
				
					$acc['Account']['name'] =$stud['full_name'];
					$acc['Account']['sno'] =$stud['sno'];
					
					$acc['Account']['year_level'] =$yearLevel;
					$acc['Account']['section'] =$section;
				}else if($inqu){
					$yrlvId =  $acc['Inquiry']['year_level_id'];
					$yearLevel = "";
					$section = "";
				
					if(isset($yrLevels[$yrlvId]))
						$yearLevel = $yrLevels[$yrlvId];
					
				
					$acc['Account']['name'] =$inqu['full_name'];
					$acc['Account']['sno'] =$acc['Account']['id'];
					
					$acc['Account']['year_level'] =$yearLevel;
					$acc['Account']['section'] =$section;
				}

				$acc['Account']['account_no'] =$acc['Account']['id'];
				//pr($acc); exit();
				//$acc['department_id'] = $stud['department_id'];
				$accounts[$i]=$acc;
			}
		}
		//exit();
		//TODOS: Adjust data based on tests/accounts.js
		$this->set('accounts',$accounts);
	}

	function view($id = null) {
		if (!$id) {
			$this->Session->setFlash(__('Invalid account', true));
			$this->redirect(array('action' => 'index'));
		}
		$this->set('account', $this->Account->read(null, $id));
	}

	function add() {
		if (!empty($this->data)) {
			$this->Account->create();
			if ($this->Account->save($this->data)) {
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
			if ($this->Account->save($this->data)) {
				$this->Session->setFlash(__('The account has been saved', true));
				$this->redirect(array('action' => 'index'));
			} else {
				$this->Session->setFlash(__('The account could not be saved. Please, try again.', true));
			}
		}
		if (empty($this->data)) {
			$this->data = $this->Account->read(null, $id);
		}
	}

	function delete($id = null) {
		if (!$id) {
			$this->Session->setFlash(__('Invalid id for account', true));
			$this->redirect(array('action'=>'index'));
		}
		if ($this->Account->delete($id)) {
			$this->Session->setFlash(__('Account deleted', true));
			$this->redirect(array('action'=>'index'));
		}
		$this->Session->setFlash(__('Account was not deleted', true));
		$this->redirect(array('action' => 'index'));
	}
}
