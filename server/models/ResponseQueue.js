import { Schema, model } from "mongoose";

const ResponseQueueSchema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  conversation: {
    type: Array,
    required: true,
  },
});

ResponseQueueSchema.methods.pushToConversationQueue = function(response) {
    this.conversation.push(response);
    return this.save();
};

ResponseQueueSchema.statics.getQueueByUserId = function(userId) {
    return this.findOne({ userId: userId }).then(queue => {
        if (queue) {
            return queue;
        } else {
            return this.create({ userId: userId, conversation: [] });
        }
    });
};

ResponseQueueSchema.statics.clearQueueByUserId = function(userId) {
  return this.findOneAndUpdate(
    { userId: userId },
    { $set: { conversation: [] } },
    { new: true }
  );
};

const ResponseQueue = model("ResponseQueue", ResponseQueueSchema);
export default ResponseQueue;