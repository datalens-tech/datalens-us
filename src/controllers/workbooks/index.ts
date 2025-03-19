import {copyTemplateController} from './copy-template';
import {copyWorkbookController} from './copy-workbook';
import {createWorkbookController} from './create-workbook';
import {deleteWorkbookController} from './delete-workbook';
import {deleteWorkbooksListController} from './delete-workbooks-list';
import {getAllWorkbooksController} from './get-all-workbook';
import {getWorkbookController} from './get-workbook';
import {getWorkbookContentController} from './get-workbook-content';
import {getWorkbookListController} from './get-workbook-list';
import {getWorkbookListByIdsController} from './get-workbook-list-by-ids';
import {moveWorkbookController} from './move-workbook';
import {moveWorkbooksListController} from './move-workbooks-list';
import {restoreWorkbookController} from './restore-workbook';
import {setIsTemplateController} from './set-is-template';
import {updateWorkbookController} from './update-workbook';

export default {
    createWorkbookController,
    updateWorkbookController,
    moveWorkbookController,
    moveWorkbooksListController,
    deleteWorkbookController,
    deleteWorkbooksListController,
    copyWorkbookController,
    getWorkbookController,
    getWorkbookContentController,
    getWorkbookListController,
    getWorkbookListByIdsController,
    setIsTemplateController,
    copyTemplateController,
    getAllWorkbooksController,
    restoreWorkbookController,
};
