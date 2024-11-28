const mongoose = require("mongoose");
// const connectDB = require("../../db/mongooseConfig");
// connectDB(); // Ensure the database is connected

const UserSchema = new mongoose.Schema({
  First_Name: String, // Maps to 'First_Name' in the database
  Last_Name: String, // Maps to 'Last_Name' in the database
  email: String, // Maps to 'email' in the database
  Phone_Number: String, // Maps to 'Phone_Number' in the database
  password: String, // Maps to 'password' in the database
  confirm_password: String, // Maps to 'confirm_password'
  company_name: String, // Maps to 'company_name'
  company_address: String, // Maps to 'company_address'
  company_city: String, // Maps to 'company_city'
  company_state: String, // Maps to 'company_state'
  company_zip: String, // Maps to 'company_zip'
  company_country: String, // Maps to 'company_country'
  company_url: String, // Maps to 'company_url'
  company_product: String, // Maps to 'company_product'
  product_description: String, // Maps to 'product_description'
  company_support: String, // Maps to 'company_support'
  support_phone: String, // Maps to 'support_phone'
  support_email: String, // Maps to 'support_email'
  owner_name: String, // Maps to 'owner_name'
  owner_address: String, // Maps to 'owner_address'
  owner_city: String, // Maps to 'owner_city'
  owner_state: String, // Maps to 'owner_state'
  owner_zip: String, // Maps to 'owner_zip'
  owner_country: String, // Maps to 'owner_country'
  owner_phone: String, // Maps to 'owner_phone'
  owner_skype: String, // Maps to 'owner_skype'
  owner_ssein: String, // Maps to 'owner_ssein'
  accept_credit_cards: String, // Maps to 'accept_credit_cards'
  processed_before: String, // Maps to 'processed_before'
  acct_terminated: String, // Maps to 'acct_terminated'
  time_with_processor: String, // Maps to 'time_with_processor'
  current_processor: String, // Maps to 'current_processor'
  heard_about_us: String, // Maps to 'heard_about_us'
  agent_name: String, // Maps to 'agent_name'
  agent_id: String, // Maps to 'agent_id'
  monthly_sales: String, // Maps to 'monthly_sales'
  times_transaction: Number, // Maps to 'times_transaction'
  max_ticket_value: String, // Maps to 'max_ticket_value'
  min_ticket_value: String, // Maps to 'min_ticket_value'
  app_date: String, // Maps to 'app_date'
  I_agree_terms: String, // Maps to 'I_agree_terms'
  tokens: [
    {
      _id: mongoose.Schema.Types.ObjectId,
      token: String,
    },
  ],
  createdAt: Date, // Maps to 'createdAt'
  updatedAt: Date, // Maps to 'updatedAt'
  __v: Number, // Maps to '__v' (versioning in MongoDB)
  user_number: Number, // Maps to 'user_number'
  username: String, // Maps to 'username'
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
