import Form from '../model/Formmodel.js';

import FormResponse from '../model/FormResponsemodel.js';
import { isValidObjectId } from 'mongoose';


export const createForm = async (req, res) => {
  try {
    const owner = req.userId;
    const payload = req.body;

    if (!payload.title) {
      return res.status(400).json({ error: 'Form title required' });
    }


    if (!payload.headerImageUrl) delete payload.headerImageUrl;
    payload.questions = payload.questions?.map(q => ({
      ...q,
      imageUrl: q.imageUrl || undefined
    }));

    const form = new Form({ ...payload, owner });
    await form.save();
    res.status(201).json(form);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const updateForm = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid form id' });
    }

    const payload = req.body;

    // ✅ Same cleanup for update
    if (!payload.headerImageUrl) delete payload.headerImageUrl;
    payload.questions = payload.questions?.map(q => ({
      ...q,
      imageUrl: q.imageUrl || undefined
    }));

    const form = await Form.findOneAndUpdate(
      { _id: id, owner: req.userId },
      { ...payload, updatedAt: Date.now() },
      { new: true }
    );

    if (!form) {
      return res.status(403).json({ error: 'Not authorized or form not found' });
    }
    res.json(form);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const getallUserForm = async (req, res) => {
  try {
    const userId = req.userId;
    
 
    const forms = await Form.find({ owner: userId }).select('-__v').sort({ createdAt: -1 });
    
    if (!forms || forms.length === 0) {
      return res.status(404).json({ error: 'No forms found for this user' });
    }


    const formsWithStats = await Promise.all(forms.map(async (form) => {
 
      const responseCount = await FormResponse.countDocuments({ formId: form._id });
      
    
      const recentResponses = await FormResponse.find({ formId: form._id })
        .sort({ submittedAt: -1 })
       
        .select('responder submittedAt')
        .populate('responder', 'name email');

    
      const hasResponded = await FormResponse.exists({ 
        formId: form._id, 
        responder: userId 
      });

      return {
        ...form.toObject(),
        responseCount,
        hasResponded,
        recentResponses: recentResponses.map(r => ({
          _id: r._id, 
          responder: r.responder,
          submittedAt: r.submittedAt
        }))
      };
    }));

    return res.status(200).json(formsWithStats);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};


export const getForm = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("hey");
    if (!isValidObjectId(id)) return res.status(400).json({ error: 'Invalid form id' });

    const form = await Form.findById(id).select('-__v');
    if (!form) return res.status(404).json({ error: 'Form not found' });
    res.json(form);
  } catch (err) {
 console.log(err)
   return res.status(500).json({ error: 'Server error' });
  }
};



export const submitResponse = async (req, res) => {
  try {
    const { id } = req.params; // form id
    const { answers } = req.body;
 const responder = req.userId;  
    if (!isValidObjectId(id)) return res.status(400).json({ error: 'Invalid form id' });

    const form = await Form.findById(id);
    if (!form) return res.status(404).json({ error: 'Form not found' });

    const response = await FormResponse.create({
      formId: id,
      responder:responder,
      answers
    });
    res.status(201).json({ success: true, id: response._id });
  } catch (err) {
 console.log(err)
   return res.status(500).json({ error: 'Server error' });
  }
};


export const getResponses = async (req, res) => {
  try {
    const { id } = req.params;
     console.log('Request Params:', req.params);  // Debug: check params received
    console.log('User ID:', req.userId);  
    if (!isValidObjectId(id)) return res.status(400).json({ error: 'Invalid form id' });

    const form = await Form.findById(id);
    if (!form) return res.status(404).json({ error: 'Form not found' });
    if (form.owner.toString() !== req.userId) return res.status(403).json({ error: 'Not authorized' });

    const responses = await FormResponse.find({ formId: id }).sort({ submittedAt: -1 });
    res.json(responses);
  } catch (err) {
 console.log(err)
   return res.status(500).json({ error: 'Server error' });
  }
};
export const getAllResponsesByUser = async (req, res) => {
  try {
    const userId = req.userId;

    const forms = await Form.find({ owner: userId })
      .select("_id title description")
      .lean();

    const formsWithResponses = await Promise.all(
      forms.map(async (form) => {
        const responses = await FormResponse.find({ formId: form._id })
          .populate("responder", "name email")
          .sort({ submittedAt: -1 })
          .limit(3) 
          .lean();

        return {
          ...form,
          responseCount: await FormResponse.countDocuments({ formId: form._id }),
          recentResponses: responses.map((r) => ({
            _id: r._id, 
            responder: r.responder,
            submittedAt: r.submittedAt
          }))
        };
      })
    );

    res.json(formsWithResponses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};


export const getSingleResponse = async (req, res) => {
  try {
    const { responseId } = req.params;
    const userId = req.userId;

    if (!isValidObjectId(responseId)) {
      return res.status(400).json({ error: 'Invalid response id' });
    }

    const response = await FormResponse.findById(responseId)
      .populate('responder', 'name email')
      .lean();
    
    if (!response) return res.status(404).json({ error: 'Response not found' });

    const form = await Form.findById(response.formId)
      .select('title description headerImageUrl questions owner')
      .lean();
    
    if (!form) return res.status(404).json({ error: 'Form not found' });
    
    if (form.owner.toString() !== userId && response.responder._id.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const detailedAnswers = response.answers.map(answer => {
      const question = form.questions.find(q => q.qid === answer.qid);
      return {
        question: question || { 
          qid: answer.qid, 
          title: 'Question not found', 
          type: 'unknown',
          imageUrl: null 
        },
        answer: answer.value
      };
    });

    res.json({
      _id: response._id,
      form: { 
        _id: form._id, 
        title: form.title,
        description: form.description,
        headerImageUrl: form.headerImageUrl 
      },
      responder: response.responder,
      submittedAt: response.submittedAt,
      answers: detailedAnswers,
      questions: form.questions 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
