const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true,
    trim: true
  },
  downloadable: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Resource', ResourceSchema);
