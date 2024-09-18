const express = require('express');
const cors = require('cors');
require('dotenv').config();


const nodemailer = require('nodemailer');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

// MongoDB connection URI
const uri = "mongodb://rizonrahat199:gpeYJ3jTyAALnHAr@ac-jif2aos-shard-00-00.u9sh80h.mongodb.net:27017,ac-jif2aos-shard-00-01.u9sh80h.mongodb.net:27017,ac-jif2aos-shard-00-02.u9sh80h.mongodb.net:27017/?ssl=true&replicaSet=atlas-rzyffr-shard-0&authSource=admin&retryWrites=true&w=majority";
const secretKey = process.env.JWT_SECRET_KEY;

// Create MongoDB client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'redwantamim525@gmail.com', // Replace with your email address
    pass: 'frvc salm lytx dzwz'      // Replace with your Gmail app password
  }
});

async function run() {
  try {
    // await client.connect();

    const employeeCollection = client.db("sayem").collection("employees");
    const formCollection = client.db("sayem").collection("form");
    const emailCollection = client.db("sayem").collection("email");

    // Employee CRUD Operations

    // GET all employees
    app.get("/employees", async (req, res) => {
      try {
        const employees = await employeeCollection.find().toArray();
        res.send(employees);
      } catch (error) {
        res.status(500).send({ error: 'Failed to fetch employees' });
      }
    });

    // POST new employee
    app.post("/employees", async (req, res) => {
      try {
        const employee = req.body;
        const result = await employeeCollection.insertOne(employee);
        res.status(201).send(result);
      } catch (error) {
        res.status(500).send({ error: 'Failed to create employee' });
      }
    });

    // PUT update existing employee by ID
    app.put("/employees/:id", async (req, res) => {
      try {
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ error: 'Invalid ID format' });
        }

        const updatedEmployee = req.body;

        if (!updatedEmployee || Object.keys(updatedEmployee).length === 0) {
          return res.status(400).json({ error: 'No update fields provided' });
        }

        const query = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: updatedEmployee,
        };

        const result = await employeeCollection.updateOne(query, updateDoc);

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: 'Employee not found' });
        }

        res.json(result);
      } catch (error) {
        res.status(500).json({ error: 'An error occurred while updating the employee' });
      }
    });

    // DELETE employee by ID
    app.delete("/employees/:id", async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ error: 'Invalid ID format' });
        }

        const query = { _id: new ObjectId(id) };
        const result = await employeeCollection.deleteOne(query);

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: 'Employee not found' });
        }

        res.send({ message: 'Employee deleted successfully' });
      } catch (error) {
        res.status(500).send({ error: 'Failed to delete employee' });
      }
    });

    // Form Handling

    // GET all form entries
    app.get("/form", async (req, res) => {
      try {
        const forms = await formCollection.find().toArray();
        res.send(forms);
      } catch (error) {
        res.status(500).send({ error: 'Failed to fetch forms' });
      }
    });

    // POST new form entry
    app.post("/form", async (req, res) => {
      try {
        const formData = req.body;
        const result = await formCollection.insertOne(formData);
        res.status(201).send(result);
      } catch (error) {
        res.status(500).send({ error: 'Failed to create form entry' });
      }
    });

    // DELETE a form entry
    app.delete('/form/:id', async (req, res) => {
      try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ error: 'Invalid ID format' });
        }

        const result = await formCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
          return res.status(404).send({ error: 'Form entry not found' });
        }
        res.send({ message: 'Form entry deleted successfully' });
      } catch (error) {
        res.status(500).send({ error: 'Failed to delete form entry' });
      }
    });

    // Email Handling

    // GET all emails
    app.get("/emails", async (req, res) => {
      try {
        const emails = await emailCollection.find().toArray();
        res.send(emails);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch emails' });
      }
    });

    // POST new email
    app.post("/emails", async (req, res) => {
      try {
        const { email } = req.body;
        if (!email) {
          return res.status(400).json({ error: 'Email is required' });
        }

        const result = await emailCollection.insertOne({ email });
        res.status(201).send(result);
      } catch (error) {
        res.status(500).json({ error: 'Failed to add email' });
      }
    });

    // PUT update existing email by ID
    app.put("/emails/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const { email } = req.body;

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ error: 'Invalid ID format' });
        }

        if (!email) {
          return res.status(400).json({ error: 'Email is required' });
        }

        const query = { _id: new ObjectId(id) };
        const updateDoc = { $set: { email } };
        const result = await emailCollection.updateOne(query, updateDoc);

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: 'Email not found' });
        }

        res.json(result);
      } catch (error) {
        res.status(500).json({ error: 'Failed to update email' });
      }
    });

    // DELETE email by ID
    app.delete("/emails/:id", async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ error: 'Invalid ID format' });
        }

        const query = { _id: new ObjectId(id) };
        const result = await emailCollection.deleteOne(query);

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: 'Email not found' });
        }

        res.json(result);
      } catch (error) {
        res.status(500).json({ error: 'Failed to delete email' });
      }
    });

    // Route to send email using Nodemailer
    app.post('/send-email', async (req, res) => {
      const { name, email, phone, message } = req.body;

      try {
        const emailList = await emailCollection.find().toArray();
        const emailAddresses = emailList.map(e => e.email).join(', ');

        const mailOptions = {
          from: email,
          to: emailAddresses,
          subject: 'Service Request',
          text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: 'Email sent successfully!' });
      } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Failed to send email. Please try again later.' });
      }
    });

  } finally {
    // Optionally close the client (if you want to close the connection after some operations)
    // await client.close();
  }
}

run().catch(console.error);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

