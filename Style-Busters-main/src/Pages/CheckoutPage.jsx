import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { useCart } from '../Context/CartContext';
import Button from '../Common/Button/Button';
import CartView from '../Components/CartView/CartView';
import AddressForm from '../Components/Checkout/Address/AddressForm';
import AddressList from '../Components/Checkout/Address/AddressList';
import PaymentForm from '../Components/Checkout/PaymentMethods/PaymentForm';
import PaymentList from '../Components/Checkout/PaymentMethods/PaymentList';
import SummarySection from '../Components/Checkout/Shared/SummarySection';
import {getDefaultPaymentMethod, getPaymentMethods} from "../Services/paymentService"
import { getDefaultShippingAddress, getShippingAddresses } from '../Services/shippingService';
import './CheckoutPage.css';

const CheckoutPage = () => {
    const { user, login } = useAuth();
    const { cart, total, clearCart } = useCart();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [orderCompleted, setOrderCompleted] = useState(false);

      
  const [addresses, setAddresses] = useState([]);
  const [payments, setPayments] = useState([]);

 
  const [loadingLocal, setLoadingLocal] = useState(true);
  const [localError, setLocalError] = useState(null);


  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  
  const [editingAddress, setEditingAddress] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);

  // Control de acordeones/secciones expandidas
  const [addressSectionOpen, setAddressSectionOpen] = useState(false);
  const [paymentSectionOpen, setPaymentSectionOpen] = useState(false);

  // Selección actual del usuario
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);


  useEffect(() => {
    /**
     * Función asíncrona para cargar datos iniciales.
     * Obtiene direcciones y métodos de pago en paralelo.
     * Establece los valores por defecto si existen.
     */
    async function loadData() {
      setLoadingLocal(true);
      setLocalError(null);
      try {
        // Carga paralela de datos para mejorar performance
        const [addrList, firstAddress, payList, firstPayment] =
          await Promise.all([
            getShippingAddresses(),
            getDefaultShippingAddress(),
            getPaymentMethods(),
            getDefaultPaymentMethod(),
          ]);

        setAddresses(addrList || []);
        setPayments(payList || []);

        // Pre-seleccionar valores por defecto
        setSelectedAddress(firstAddress);
        setSelectedPayment(firstPayment);

        // Abrir secciones si no hay datos seleccionados
        setAddressSectionOpen(!firstAddress);
        setPaymentSectionOpen(!firstPayment);
      } catch (err) {
        setLocalError("No se pudo cargar direcciones o métodos de pago.");
      } finally {
        setLoadingLocal(false);
      }
    }

    loadData();
  }, []);

  // --- HANDLERS PARA DIRECCIONES (CRUD Local) ---

  /**
   * Alterna la visibilidad de la sección de direcciones.
   * Cierra el formulario si estaba abierto.
   */
  const handleAddressToggle = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressSectionOpen((prev) => !prev);
  };

  /**
   * Selecciona una dirección existente y cierra el acordeón.
   * @param {Object} address - La dirección seleccionada.
   */
  const handleSelectAddress = (address) => {
    setSelectedAddress(address);
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressSectionOpen(false);
  };

  
  const handleAddressNew = () => {
    setShowAddressForm(true);
    setEditingAddress(null);
    setAddressSectionOpen(true);
  };

  /**
   * Inicia el proceso de edición de una dirección existente.
   * Abre el formulario precargado con los datos de la dirección.
   * @param {Object} address - La dirección a editar.
   */
  const handleAddressEdit = (address) => {
    setShowAddressForm(true);
    setEditingAddress(address);
    setAddressSectionOpen(true);
  };

  /**
   * Elimina una dirección de la lista local.
   * Si la dirección eliminada estaba seleccionada, intenta seleccionar otra.
   */
  const handleAddressDelete = (address) => {
    const updatedAddresses = addresses.filter((add) => add._id !== address._id);
    // Si borramos la seleccionada, seleccionamos la primera disponible o null
    if (selectedAddress?._id === address._id) {
      setSelectedAddress(updatedAddresses[0] || null);
    }
    setAddresses(updatedAddresses);
  };

  /**
   * Maneja el guardado (Creación o Edición) de una dirección.
   * Actualiza la lista local y la selección automáticamente para mejorar UX.
   */
  const handleAddressSubmit = (formData) => {
    let updatedAddresses;
    let newSelectedAddress = selectedAddress;

    if (editingAddress) {
      // EDICIÓN: Actualizamos la lista
      updatedAddresses = addresses.map((addr) =>
        addr._id === editingAddress._id ? { ...addr, ...formData } : addr
      );

      // Si la que editamos estaba seleccionada, actualizamos también el estado de selección
      // para que refleje los cambios inmediatamente en el resumen.
      if (selectedAddress?._id === editingAddress._id) {
        newSelectedAddress = updatedAddresses.find(
          (a) => a._id === editingAddress._id
        );
      }
    } else {
      // CREACIÓN: Agregamos y seleccionamos automáticamente (UX tipo Amazon)
      const newAddress = { _id: Date.now().toString(), ...formData };
      updatedAddresses = [...addresses, newAddress];
      newSelectedAddress = newAddress;
    }

    setAddresses(updatedAddresses);
    setSelectedAddress(newSelectedAddress);
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressSectionOpen(false);
  };

  /**
   * Cancela la operación actual (creación o edición) de dirección.
   * Cierra el formulario y limpia el estado de edición.
   */
  const handleCancelAddress = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressSectionOpen(false);
  };

  // --- HANDLERS PARA PAGOS (CRUD Local) ---

  /**
   * Alterna la visibilidad de la sección de pagos.
   * Cierra el formulario si estaba abierto.
   */
  const handlePaymentToggle = () => {
    setShowPaymentForm(false);
    setEditingPayment(null);
    setPaymentSectionOpen((prev) => !prev);
  };

  /**
   * Selecciona un método de pago existente y cierra el acordeón.
   * @param {Object} payment - El método de pago seleccionado.
   */
  const handleSelectPayment = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentForm(false);
    setEditingPayment(null);
    setPaymentSectionOpen(false);
  };

  /**
   * Inicia el proceso de creación de un nuevo método de pago.
   * Abre el formulario en modo creación.
   */
  const handlePaymentNew = () => {
    setShowPaymentForm(true);
    setEditingPayment(null);
    setPaymentSectionOpen(true);
  };

  /**
   * Inicia el proceso de edición de un método de pago existente.
   * Abre el formulario precargado con los datos del pago.
   * @param {Object} payment - El método de pago a editar.
   */
  const handlePaymentEdit = (payment) => {
    setShowPaymentForm(true);
    setEditingPayment(payment);
    setPaymentSectionOpen(true);
  };

  /**
   * Elimina un método de pago de la lista local.
   * Si el pago eliminado estaba seleccionado, intenta seleccionar otro.
   * @param {Object} payment - El método de pago a eliminar.
   */
  const handlePaymentDelete = (payment) => {
    const updatedPayments = payments.filter((pay) => pay._id !== payment._id);
    // Si borramos el seleccionado, seleccionamos el primero disponible o null
    if (selectedPayment?._id === payment._id) {
      setSelectedPayment(updatedPayments[0] || null);
    }
    setPayments(updatedPayments);
  };

  /**
   * Maneja el guardado (Creación o Edición) de un método de pago.
   * Actualiza la lista local y la selección automáticamente.
   * @param {Object} formData - Datos del formulario de pago.
   */
  const handlePaymentSubmit = (formData) => {
    let updatedPayments;
    let newSelectedPayment = selectedPayment;

    if (editingPayment) {
      // EDICIÓN
      updatedPayments = payments.map((pay) =>
        pay._id === editingPayment._id ? { ...pay, ...formData } : pay
      );

      // Sincronizar selección si se editó el actual
      if (selectedPayment?._id === editingPayment._id) {
        newSelectedPayment = updatedPayments.find(
          (p) => p._id === editingPayment._id
        );
      }
    } else {
      // CREACIÓN: Auto-seleccionar
      const newPayment = { _id: Date.now().toString(), ...formData };
      updatedPayments = [...payments, newPayment];
      newSelectedPayment = newPayment;
    }

    setPayments(updatedPayments);
    setSelectedPayment(newSelectedPayment);
    setShowPaymentForm(false);
    setEditingPayment(null);
    setPaymentSectionOpen(false);
  };

  /**
   * Cancela la operación actual (creación o edición) de pago.
   * Cierra el formulario y limpia el estado de edición.
   */
  const handleCancelPayment = () => {
    setShowPaymentForm(false);
    setEditingPayment(null);
    setPaymentSectionOpen(false);
  };

  // --- FINALIZACIÓN DE ORDEN ---

  /**
   * Crea el objeto de orden final y simula el envío.
   * Guarda en localStorage para persistencia simple y redirige.
   */
  const handleCreateOrder = () => {
    if (
      !selectedAddress ||
      !selectedPayment ||
      !cart ||
      cart.length === 0
    ) {
      return;
    }

    const order = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      items: cart.map((item) => ({
        ...item,
        subtotal: item.price * item.quantity,
      })),
      shippingAddress: selectedAddress,
      paymentMethod: selectedPayment,
      status: "confirmed",
    };

    // Simulación de persistencia
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    orders.push(order);
    localStorage.setItem("orders", JSON.stringify(orders));
    debugger;
    setOrderCompleted(true); 
    clearCart(); 
    navigate("/order-confirmation", { state: { order } });
  };

    useEffect(() => {
        if (cart.length === 0 && !orderCompleted) {
            navigate('/cart');
        }
    }, [cart, navigate, orderCompleted]);
    if (cart.length === 0) {
        return null; 
    }

    const handleLogin = (e) => {
        e.preventDefault();
        if (email) login(email);
    };

    if (!user) {
        return (
            <div className="login-container">
                <h2 className="login-title">Inicia sesión para continuar</h2>
                <div className="login-card">
                    <form onSubmit={handleLogin} className="login-form">
                        <input
                            type="email"
                            placeholder="Tu correo electrónico"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="login-input"
                        />
                        <button type="submit" className="btn-primary">
                            Continuar como Invitado
                        </button>
                    </form>
                    <p className="login-note">
                        (Simulación: ingresa cualquier correo)
                    </p>
                    <p className="login-note">
                        (Simulación: ingresa la contraseña "12345")
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="checkout-container">
            <h1 className="checkout-title">Checkout</h1>

            <div className="checkout-layout">
                    <div className="checkout-section">
                        <SummarySection
                            title="1. Dirección de envío"
                            selected={selectedAddress}
                            summaryContent={
                                <div className="selected-address">
                                    <p>{selectedAddress?.name}</p>
                                    <p>{selectedAddress?.address1}</p>
                                    <p>{selectedAddress?.city}, {selectedAddress?.postalCode}</p>
                                </div>
                            }
                            isExpanded={
                                showAddressForm || addressSectionOpen || !selectedAddress
                            }
                            onToggle={handleAddressToggle}
                        >
                        {!showAddressForm && !editingAddress ? (
                        <AddressList
                            addresses={addresses}
                            selectedAddress={selectedAddress}
                            onSelect={handleSelectAddress}
                            onEdit={handleAddressEdit}
                            onAdd={handleAddressNew}
                            onDelete={handleAddressDelete}
                        />
                    ) : (
                        <AddressForm
                            onSubmit={handleAddressSubmit}
                            onCancel={handleCancelAddress}
                            initialValues={editingAddress || {}}
                            isEdit={!!editingAddress}
                        />
                    )}
                </SummarySection>

                <SummarySection
                    title="2. Método de pago"
                    selected={selectedPayment}
                    summaryContent={
                        <div className="selected-payment">
                            <p>{selectedPayment?.alias}</p>
                            <p>**** {selectedPayment?.cardNumber?.slice(-4) || "----"}</p>
                        </div>
                    }
                    isExpanded={
                    showPaymentForm || paymentSectionOpen || !selectedPayment
                    }
                    onToggle={handlePaymentToggle}
                >
                    {!showPaymentForm && !editingPayment ? (
                        <PaymentList
                            payments={payments}
                            selectedPayment={selectedPayment}
                            onSelect={handleSelectPayment}
                            onEdit={handlePaymentEdit}
                            onAdd={handlePaymentNew}
                            onDelete={handlePaymentDelete}
                        />
                    ) : (
                        <PaymentForm
                            onSubmit={handlePaymentSubmit}
                            onCancel={handleCancelPayment}
                            initialValues={editingPayment || {}}
                            isEdit={!!editingPayment}
                        />
                    )}
                </SummarySection>

                <SummarySection
                    title="3. Revisa tu pedido"
                    selected={true}
                    isExpanded={true}
                >
                    <CartView />
                    <p>
                            <strong>Fecha estimada de entrega:</strong>{" "}
                            {new Date(
                                Date.now() + 7 * 24 * 60 * 60 * 1000
                            ).toLocaleDateString()}
                        </p>
                        <Button
                            className="pay-button"
                            disabled={
                                !selectedAddress ||
                                !selectedPayment ||
                                !cart ||
                                cart.length === 0
                            }
                            title={
                                !cart || cart.length === 0
                                    ? "No hay productos en el carrito"
                                    : !selectedAddress
                                    ? "Selecciona una dirección de envío"
                                    : !selectedPayment
                                    ? "Selecciona un método de pago"
                                    : "Confirmar y realizar el pago"
                            }
                            onClick={handleCreateOrder}
                        >
                            Confirmar y Pagar
                        </Button>
                </SummarySection>
            </div>
        </div>


        </div>
    );
};

export default CheckoutPage;