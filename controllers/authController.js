// const Organization = require('../models/organizationModel');
// const User = require('../models/userModel');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');

// const { sendVerificationEmail } = require('../middleware/sendVerificationEmail');

// // Function to generate a random 5-digit code
// const generateVerificationCode = () => {
//     return Math.floor(10000 + Math.random() * 90000).toString();
// };

// // Register Organization and Owner with JWT
// const registerOrganization = async (req, res) => {

//     const { ownerName, email, password, confirmPassword, orgName } = req.body;

//     // Check if password and confirmation match
//     if (!password || password !== confirmPassword) {
//         return res.status(400).json({ message: 'Passwords do not match' });
//     }

//     try {
//         // Check if organization already exists
//         const orgExists = await Organization.findOne({ name: orgName });
//         if (orgExists) {
//             return res.status(400).json({ message: 'Organization already exists' });
//         }

//         // Hash the password
//         const hashedPassword = await bcrypt.hash(password, 10);

//         // Create the organization owner
//         const owner = new User({
//             name: ownerName,
//             email,
//             password: hashedPassword,
//             role: 'owner',
//         });

//         await owner.save();

//         // Create the organization
//         const organization = new Organization({
//             name: orgName,
//             email,
//             owner: owner._id,
//         });

//         await organization.save();

//         // Generate verification code
//         const verificationCode = generateVerificationCode();

//         // Set verification code and expiration
//         owner.verificationCode = verificationCode;
//         owner.verificationExpires = Date.now() + (process.env.VERIFICATION_EXPIRY || 3600000); // Expiry is now configurable
//         await owner.save();

//         // Send verification email
//         const emailSent = await sendVerificationEmail(owner.email, verificationCode);

//         if (!emailSent.success) {
//             return res.status(500).json({ message: 'Failed to send verification email' });
//         }

//         // Generate JWT
//         const token = jwt.sign(
//             { userId: owner._id, organizationId: organization._id, role: owner.role },
//             process.env.JWT_SECRET,
//             { expiresIn: '1h' }
//         );

//         res.status(201).json({
//             message: 'Registration success, please verify your email',
//             organization,
//             email: owner.email,
//             token
//         });

//     } catch (error) {
//         console.error('Error during registration:', error);
//         res.status(500).json({ message: error.message });
//     }
// };



// // Login User
// const loginUser = async (req, res) => {
//     const { email, password } = req.body;

//     try {
//         // Check if user exists
//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.status(404).json({ message: 'User with this email does not exist' });
//         }

//         // Compare password with hashed password
//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             return res.status(400).json({ message: 'Invalid email or password' });
//         }

//         // Generate JWT
//         const token = jwt.sign({ userId: user._id, organizationId: user.organization, role: user.role }, process.env.JWT_SECRET, {
//             expiresIn: '1h',
//         });

//         res.status(200).json({
//             message: 'Login successful',
//             token,
//             organizationId: user.organization,
//         });
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };


// // Verify Email
// const verifyEmail = async (req, res) => {
//     const { email, code } = req.body;

//     try {
//         const user = await User.findOne({ email });

//         // Check if user exists and if the code is correct
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         // Check if the verification code matches and is not expired
//         if (user.verificationCode !== code || user.verificationExpires < Date.now()) {
//             return res.status(400).json({ message: 'Invalid or expired verification code' });
//         }

//         // If valid, mark the user as verified
//         user.isVerified = true;
//         user.verificationCode = undefined; // Clear the code
//         user.verificationExpires = undefined; // Clear the expiration
//         await user.save();

//         res.status(200).json({ message: 'Email verified successfully' });
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };


// module.exports = { registerOrganization, loginUser, verifyEmail };




const Organization = require('../models/organizationModel');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail } = require('../middleware/sendVerificationEmail');

// Function to generate a random 5-digit code
const generateVerificationCode = () => {
    return Math.floor(10000 + Math.random() * 90000).toString();
};

// Register Organization and Owner with JWT
const registerOrganization = async (req, res) => {
    const { ownerName, email, password, confirmPassword, orgName } = req.body;

    // Check if password and confirmation match
    if (!password || password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    try {
        // Check if organization already exists
        const orgExists = await Organization.findOne({ name: orgName });
        if (orgExists) {
            return res.status(400).json({ message: 'Organization already exists' });
        }

        // Check if email already exists
        const emailExists = await User.findOne({ email });
        if (emailExists) {
            return res.status(400).json({ message: 'Email is already in use' }); // Custom error message for email duplication
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the organization
        const organization = new Organization({
            name: orgName,
            email,
        });

        // Save the organization first to get its ID
        await organization.save();

        // Create the organization owner and attach the organization ID
        const owner = new User({
            name: ownerName,
            email,
            password: hashedPassword,
            role: 'owner',
            organization: organization._id, // Set the organization ID here
        });

        await owner.save(); // Save the owner

        // Generate verification code
        const verificationCode = generateVerificationCode();

        // Set verification code and expiration
        owner.verificationCode = verificationCode;
        owner.verificationExpires = Date.now() + (process.env.VERIFICATION_EXPIRY || 3600000); // Expiry is now configurable
        await owner.save();

        // Send verification email
        const emailSent = await sendVerificationEmail(owner.email, verificationCode);

        if (!emailSent.success) {
            return res.status(500).json({ message: 'Failed to send verification email' });
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: owner._id, organizationId: organization._id, role: owner.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(201).json({
            message: 'Registration success, please verify your email',
            organization,
            email: owner.email,
            token
        });

    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: error.message });
    }
};



// Login User
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User with this email does not exist' });
        }

        // Compare password with hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user._id, organizationId: user.organization, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            organizationId: user.organization,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Verify Email
const verifyEmail = async (req, res) => {
    const { email, code } = req.body;

    try {
        const user = await User.findOne({ email });

        // Check if user exists and if the code is correct
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the verification code matches and is not expired
        if (user.verificationCode !== code || user.verificationExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired verification code' });
        }

        // If valid, mark the user as verified
        user.isVerified = true;
        user.verificationCode = undefined; // Clear the code
        user.verificationExpires = undefined; // Clear the expiration
        await user.save();

        res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerOrganization, loginUser, verifyEmail };
