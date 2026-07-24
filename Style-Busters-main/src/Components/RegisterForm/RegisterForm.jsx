import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {register} from "../../Services/authService"; 
import Button from "../Common/Button"; 
import ErrorMessage  from "../Common/ErrorMessage/ErrorMessage"; 
import Input from "../Common/Input"; 
import "./RegisterForm.css"; 
import RegisterErrorMessage from "../RegisterErrorMessage/RegisterErrorMessage";



export default function RegisterForm() {
    const navigate = useNavigate(); 

    const [form, setForm] = useState({
        name: "",
        email: "", 
        password: "", 
        confirmPassword: "", 
        phone: "",
    }); 

    const [loading, setLoading] = useState(false); 
    const [errorKind, setErrorKind] = useState(null); 
    const [fieldErrors, setFieldErrors] = useState({}); 

    const handleChange = (field) => (event) => {
        setForm((prev) => ({...prev, [field]: event.target.value })); 
        //Limpiar error de ese campo si lo había
        if (fieldErrors[field]){
            setFieldErrors((prev) => ({...prev, [field]: null })); 
        }
    }; 

    const validate = (form) => {
        const errors = {};
        
        if(!form.name.trim()){
            errors.name = "El nombre es requerido"
        } else if(form.name.trim().length<2){
            errors.name= "El nombre debe de tenenr al menos 2 caracteres";
        }

        if(!form.email.trim()){
            errors.email = "El email es requerido"
        } else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)){
            errors.email= "El email no tiene un formato valido";
        }

        if(!form.password.trim()){
            errors.password = "El password es requerido"
        } else if(form.password.trim().length<6){
            errors.password= "El password debe de tenenr al menos 6 caracteres";
        }

        if(form.confirmPassword !== form.password){
            errors.confirmPassword = "Las contraseñas no coinciden"
        } 

        if(form.phone && !/^[\d\s+()-]{7,}$/.test(form.phone)){
            errors.phone = "El telefono no tiene un formato valido"; 
        }


        return errors;
    }; 


    const onSubmit = async (event) => {
        event.preventDefault(); 

        const errors = validate(form); 

        if(Object.keys(errors).length>0){
            setFieldErrors(errors); 
            return; 
        }

        setFieldErrors({}); 

        setErrorKind(null); 

        setLoading(true); 

        try {
            await register(
                form.name,
                form.email,
                form.password,
                form.phone || undefined,
            );
            navigate("/login", {state:{justRegistered: true, email:form.email}}); 
        } catch (error) {
            handleRegisterError(error)
        }finally {
            setLoading(false); 
        }
    }; 

    const handleRegisterError = (err) => {
      const kind = err.kind || "UNKNOWN"; 

      if (kind === "CLIENT_ERROR" && err.status === 400) {
        const backEndMessage = err.original?.response?.data?.message; 
        if (backEndMessage === "User already exist"){
          setFieldErrors({email:"Este email ya está registrado"});
          return; 
        }

        setErrorKind("BAD_REQUEST"); 
        return; 
      }

      if(kind === "VALIDATION" && err.fields){
        const fieldErrors = {}; 
        err.fields.forEach((f) => {
          fieldErrors[f.path || f.param]= f.msg; 
        }); 
        setFieldErrors(fieldErrors); 
        return; 
      }
    }; 


    return (
      <div className="register-container">
        <div className="register-card">
          <h2>Crea tu cuenta</h2>
          <form className="register-form" onSubmit={onSubmit} noValidate>
            <div className="form-group">
              <input
                id="name"
                name="name"
                aria-label="Nombre completo"
                type="text"
                value={form.name}
                onChange={handleChange("name")}
                placeholder="Tu nombre"
                data-testid="register-name-input"
              />
              {fieldErrors.name && (
                <span className="field-error" data-testid="register-name-error">
                  {fieldErrors.name}
                </span>
              )}
            </div>

            <div className="form-group">
              <input
                id="email"
                name="email"
                aria-label="Email"
                type="email"
                value={form.email}
                onChange={handleChange("email")}
                placeholder="tu@email.com"
                data-testid="register-email-input"
              />
              {fieldErrors.email && (
                <span className="field-error" data-testid="register-email-error">
                  {fieldErrors.email}
                </span>
              )}
            </div>

            <div className="form-group">
              <input
                id="password"
                name="password"
                aria-label="Contraseña"
                type="password"
                value={form.password}
                onChange={handleChange("password")}
                placeholder="Minimo 6 caracteres"
                data-testid="register-password-input"
              />
              {fieldErrors.password && (
                <span className="field-error" data-testid="register-password-error">
                  {fieldErrors.password}
                </span>
              )}
            </div>

            <div className="form-group">
              <input
                id="confirmPassword"
                name="confirmPassword"
                aria-label="Confirmar contraseña"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange("confirmPassword")}
                placeholder="Confirma tu contraseña"
                data-testid="register-confirm-password-input"
              />
              {fieldErrors.confirmPassword && (
                <span
                  className="field-error"
                  data-testid="register-confirm-password-error"
                >
                  {fieldErrors.confirmPassword}
                </span>
              )}
            </div>

            <div className="form-group">
              <input
                id="phone"
                label="Numero de telefono (Opcional)"
                type="tel"
                value={form.phone}
                onChange={handleChange("phone")}
                placeholder="+52 449 123 4567"
              />
              {fieldErrors.phone && (
                <span className="field-error">{fieldErrors.phone}</span>
              )}
            </div>

            {errorKind && <RegisterErrorMessage kind= {errorKind} />}
            <Button
                disabled={loading}
                type="submit"
                variant="primary"
                data-testid="register-submit-button"
            >
                {loading ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
          </form>

              <div className="register-footer">
                <span>Ya tienes cuenta?</span>
                <Link to= "/login">Inicia sesión</Link>
              </div>
        </div>
      </div>
    );
}