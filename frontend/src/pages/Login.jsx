import React, { useState } from 'react';
import { Alert, Button, Form, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [isAdminRegistration, setIsAdminRegistration] = useState(false);
  const [adminSetupKey, setAdminSetupKey] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      if (isRegister) {
        await api.post('/auth/register', {
          name,
          email,
          password,
          ...(isAdminRegistration ? { role: 'Admin', adminSetupKey } : {})
        });
        setIsRegister(false);
        setIsAdminRegistration(false);
        setAdminSetupKey('');
        setPassword('');
        setMessage('Your account is ready. Sign in to continue.');
      } else {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({ name: data.name, role: data.role }));
        navigate(data.role === 'Admin' || data.role === 'Staff' ? '/dashboard' : '/rooms', { replace: true });
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to connect. Check that the hotel API is running and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-page anim-fade-in">
      <section className="login-visual">
        <div className="login-visual-content">
          <span className="login-kicker"><i className="bi bi-stars me-2" />THE HAVEN HOUSE EXPERIENCE</span>
          <h1>Hospitality,<br />beautifully managed.</h1>
          <p>A calmer way to care for your guests, your rooms, and every detail in between.</p>
        </div>
        <span className="login-image-credit">A thoughtful stay starts here</span>
      </section>
      <section className="login-form-wrap">
        <div className="login-form">
          <span className="page-eyebrow">{isRegister ? 'Join your team' : 'Welcome back'}</span>
          <h2 className="login-title">{isRegister ? 'Create your account' : 'Sign in to your hotel'}</h2>
          <p className="login-description">{isRegister ? 'Set up your profile to get started.' : 'Enter your details to access the management workspace.'}</p>

          {error && <Alert variant="danger">{error}</Alert>}
          {message && <Alert variant="success">{message}</Alert>}

          <Form onSubmit={handleSubmit}>
            {isRegister && (
              <Form.Group className="mb-3">
                <Form.Label>Full name</Form.Label>
                <Form.Control autoComplete="name" type="text" placeholder="e.g. Alex Morgan" value={name} onChange={(event) => setName(event.target.value)} required />
              </Form.Group>
            )}
            {isRegister && isAdminRegistration && (
              <Form.Group className="mb-3">
                <Form.Label>Administrator setup key</Form.Label>
                <Form.Control
                  autoComplete="off"
                  type="password"
                  placeholder="Enter the key configured by your administrator"
                  value={adminSetupKey}
                  onChange={(event) => setAdminSetupKey(event.target.value)}
                  required
                />
                <Form.Text>The setup key must be configured by the system operator.</Form.Text>
              </Form.Group>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Email address</Form.Label>
              <Form.Control autoComplete="email" type="email" placeholder="you@hotel.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Password</Form.Label>
              <Form.Control autoComplete={isRegister ? 'new-password' : 'current-password'} type="password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </Form.Group>
            <Button className="btn-primary-action w-100 login-submit" type="submit" disabled={submitting}>
              {submitting ? <><Spinner size="sm" className="me-2" />Please wait…</> : isRegister ? 'Create account' : 'Sign in'}
              {!submitting && <i className="bi bi-arrow-right ms-2" />}
            </Button>
          </Form>

          <p className="login-switch-text">
            {isRegister ? 'Already have an account?' : 'New to Haven House?'}
            <button className="login-switch" type="button" onClick={() => {
              setIsRegister(!isRegister);
              setError('');
              setMessage('');
            }}>
              {isRegister ? 'Sign in' : 'Create an account'}
            </button>
          </p>
          {isRegister && (
            <button
              className="admin-setup-switch"
              type="button"
              onClick={() => {
                setIsAdminRegistration(!isAdminRegistration);
                setAdminSetupKey('');
                setError('');
              }}
            >
              {isAdminRegistration ? 'Create a customer account instead' : 'Set up an administrator account'}
            </button>
          )}
          <div className="login-security-note"><i className="bi bi-shield-check me-2" />Your guest and property data stays secure.</div>
        </div>
      </section>
    </main>
  );
};

export default Login;
