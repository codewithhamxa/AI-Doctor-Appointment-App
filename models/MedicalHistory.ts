import mongoose from 'mongoose';

const MedicalHistorySchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reportText: { type: String, required: true },
  prescriptionFile: { type: String }, // Can store base64 or URL
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.MedicalHistory || mongoose.model('MedicalHistory', MedicalHistorySchema);
