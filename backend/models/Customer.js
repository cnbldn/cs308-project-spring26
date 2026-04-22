const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },

    role: {
      type: String,
      enum: ["customer", "salesManager", "productManager"],
      default: "customer",
    },

    taxId: {
      type: String,
      required: [true, "Tax ID is required"],
      trim: true,
    },

    homeAddress: {
      type: String,
      required: [true, "Home address is required"],
      trim: true,
    },
  },
  { timestamps: true }
);

// 🔐 Hash password before saving
customerSchema.pre("save", async function () {
  if(!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// 🔑 Compare password for login
customerSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

customerSchema.index({ role: 1 });

module.exports = mongoose.model("Customer", customerSchema);
