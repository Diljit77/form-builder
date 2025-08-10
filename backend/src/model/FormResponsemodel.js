import mongoose from 'mongoose';

const AnswerSchema = new mongoose.Schema({
  qid: String,
  value: mongoose.Schema.Types.Mixed
}, { _id: false });

const FormResponseSchema = new mongoose.Schema({
  formId: { type: mongoose.Schema.Types.ObjectId, ref: 'Form', required: true },
  responder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: [AnswerSchema],
  submittedAt: { type: Date, default: Date.now }
});

export default mongoose.model('FormResponse', FormResponseSchema);
