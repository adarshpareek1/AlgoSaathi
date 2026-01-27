import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  language: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  status: {
    type: String, // 'Success' or 'Error'
    required: true
  },
  output: {
    type: String
  }
}, { timestamps: true });

export default mongoose.model('Submission', submissionSchema);