import express from 'express';
import {
  createForm,
  getForm,
  updateForm,
  submitResponse,
  getResponses,
  getallUserForm,
  getAllResponsesByUser,
  getSingleResponse
} from '../controller/formcontroller.js';
import auth from '../middleware/authmiddleware.js';


const router = express.Router();

// Create form (protected)
router.post('/', auth, createForm);

// Update form (protected, owner check in controller)
router.put('/:id', auth, updateForm);

// Get a form (public)
router.get('/responses/:responseId', auth, getSingleResponse);

router.get('/allresponses', auth, getAllResponsesByUser);
router.get('/form/mine', auth, getallUserForm);
router.get('/:id/responses', auth, getResponses);

// Less specific route last
router.get('/:id', auth, getForm);

// Submit response (public)
router.post('/:id/responses',auth, submitResponse);

// (Optional) Get all responses for a form (owner only)

export default router;
