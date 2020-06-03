<?php

class modExtraItemRemoveProcessor extends modObjectRemoveProcessor
{
    public $objectType = 'modextra';
    public $classKey = 'modExtraItem';
    public $languageTopics = ['modextra'];
    //public $permission = 'remove';


    /**
     * @return array|string
     */
    public function initialize()
    {
        if (!$this->checkPermissions()) {
            return $this->failure($this->modx->lexicon('access_denied'));
        }

        return parent::initialize();
    }
    
    /**
     * @return bool|string
     */
    public function beforeRemove()
    {
        return parent::beforeRemove();
    }

}

return 'modExtraItemRemoveProcessor';