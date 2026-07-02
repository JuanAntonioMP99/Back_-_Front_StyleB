import PaymentMethod from "../models/PaymentMethod.js";

const getPaymentMethods = async (req, res, next) => {
  try {
    const paymentMethods = await PaymentMethod.find().populate("user");
    res.status(200).json(paymentMethods);
  } catch (error) {
    next(error);
  }
};

const getPaymentMethodsByUserId = async (req, res, next) => {
    try {
        const { id } = req.params;

        const paymentMethods = await PaymentMethod.find({ user: id }).sort({
            isDefault: -1,
            _id: -1,
        });

        res.status(200).json({ paymentMethods });
    } catch (error) {
        next(error);
    }
};

const getPaymentMethodById = async (req, res, next) => {
    try {
    const { id } = req.params;
    const paymentMethod = await PaymentMethod.findById(id).populate("user");
    if (!paymentMethod) {
      return res.status(404).json({ message: "Payment method not found" });
    }
    res.status(200).json(paymentMethod);
    } catch (error) {
    next(error);
    }
}; 


const createPaymentMethod = async (req, res, next) => {
    try {
        const {
            user,
            type,
            name,
            numCard,
            dueDate,
            cvv,
            isDefault,
        } = req.body;

        const existingPaymentMethod = await PaymentMethod.findOne({ numCard });
        if (existingPaymentMethod) {
            return res.status(409).json({ message: "Este metodo de pago ya existe" });
        }

    if (isDefault) {
        await PaymentMethod.updateMany({ user }, { isDefault: false });
    }

    const newPaymentMethod = new PaymentMethod({
        user,
        type,
        name,
        numCard,
        dueDate,
        cvv,
        isDefault: isDefault || false,
    });

    await newPaymentMethod.save();

    res.status(201).json(newPaymentMethod);
    } catch (error) {
        next(error);
    }
}; 

const updatePaymentMethod = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            type,
            name,
            numCard,
            dueDate,
            cvv,
            isDefault,
        } = req.body;

        const existing = await PaymentMethod.findById(id);
            if (!existing) {
            return res.status(404).json({ message: "Payment method not found" });
        }

        if (isDefault) {
      await PaymentMethod.updateMany(
        { user: existing.user, _id: { $ne: id } },
        { isDefault: false }
      );
    }

    const updatedPaymentMethod = await PaymentMethod.findByIdAndUpdate(
      id,
        {   type,
            name,
            numCard,
            dueDate,
            cvv,
            isDefault, 
        },
      { new: true }
    ).populate("user");
    delete updatedPaymentMethod.password;
    res.status(200).json(updatedPaymentMethod);
    } catch (error) {
        next(error); 
    }
}; 

const deletePaymentMethod = async (req, res, next) => {
    try {
        const { paymentMethodId } = req.params;
        const userId = req.user.userId;

        const shipPaymentMethod = await PaymentMethod.findOne({
            _id: addressId,
            user: userId,
        });

        if (!shipPaymentMethod) {
            return res.status(404).json({ message: "Payment method not found" });
        }

        await PaymentMethod.findByIdAndDelete(paymentMethodId);

        res.status(200).json({
            message: "Payment method deleted successfully",
        });
    } catch (error) {
        next(error);
    }
}; 

export {getPaymentMethods, getPaymentMethodsByUserId, getPaymentMethodById, createPaymentMethod, updatePaymentMethod, deletePaymentMethod}; 