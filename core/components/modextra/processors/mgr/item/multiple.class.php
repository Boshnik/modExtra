<?php

class modExtraMultipleProcessor extends modProcessor
{

    /**
     * @return array|string
     */
    public function process()
    {
        if (!$method = $this->getProperty('method', false)) {
            return $this->failure();
        }
        $ids = json_decode($this->getProperty('ids'), true);
        if (empty($ids)) {
            return $this->success();
        }

        /** @var modextra $modextra */
        $modextra = $this->modx->getService('modextra', 'modExtra', MODX_CORE_PATH . 'components/modextra/model/');

        foreach ($ids as $id) {
            /** @var modProcessorResponse $response */
            $response = $modextra->runProcessor('mgr/item/' . $method, array('id' => $id));
            if ($response->isError()) {
                return $response->getResponse();
            }
        }

        return $this->success();
    }

}

return 'modExtraMultipleProcessor';