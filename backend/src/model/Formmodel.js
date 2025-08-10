import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  qid: { type: String, required: true },
  type: { type: String, enum: ['categorize', 'cloze', 'comprehension'], required: true },
  title: String,
  imageUrl: String,
  config: { type: mongoose.Schema.Types.Mixed } // stores config per type
}, { _id: false });

const FormSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  headerImageUrl: String,
  description: String,
  questions: [QuestionSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

FormSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Form', FormSchema);
