<?php

class modExtraItemUpdateProcessor extends modObjectUpdateProcessor
{
    public $objectType = 'modextra';
    public $classKey = 'modExtraItem';
    public $languageTopics = ['modextra'];
    //public $permission = 'save';


    /**
     * @return bool|null|string
     */
    public function initialize()
    {
        if (!$this->checkPermissions()) {
            return $this->modx->lexicon('access_denied');
        }

        return parent::initialize();
    }


    /**
     * @return bool
     */
    public function beforeSet()
    {
        $id = (int)$this->getProperty('id');
        $name = trim($this->getProperty('name'));
        if (empty($id)) {
            return $this->modx->lexicon('modextra_item_err_ns');
        }

        if (empty($name)) {
            $this->modx->error->addField('name', $this->modx->lexicon('modextra_item_err_name'));
        } elseif ($this->modx->getCount($this->classKey, ['name' => $name, 'id:!=' => $id])) {
            $this->modx->error->addField('name', $this->modx->lexicon('modextra_item_err_ae'));
        }

        return parent::beforeSet();
    }
}

return 'modExtraItemUpdateProcessor';
