import React, { useMemo, useState } from 'https://esm.sh/react@18.3.1';
import { AuthService } from './authService.js';

const h = React.createElement;

function Field({ id, label, type = 'text', value, onChange, placeholder }) {
  return h(
    React.Fragment,
    null,
    h('label', { htmlFor: id }, label),
    h('input', {
      id,
      type,
      value,
      onChange: (event) => onChange(event.target.value),
      placeholder
    })
  );
}

export default function App() {
  const authService = useMemo(() => new AuthService(), []);
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [result, setResult] = useState(null);

  const handleRegister = (event) => {
    event.preventDefault();
    const response = authService.register(registerUsername, registerPassword);
    setResult({ action: 'Register', status: response.status, ...response.body });
  };

  const handleLogin = (event) => {
    event.preventDefault();
    const response = authService.login(loginUsername, loginPassword);
    setResult({ action: 'Login', status: response.status, ...response.body });
  };

  return h(
    'main',
    { className: 'container' },
    h('h1', null, 'React Auth Demo'),
    h(
      'p',
      { className: 'subtitle' },
      'In-memory registration/login with username normalization and validation.'
    ),
    h(
      'section',
      { className: 'grid' },
      h(
        'form',
        { className: 'card', onSubmit: handleRegister },
        h('h2', null, 'Register'),
        h(Field, {
          id: 'register-username',
          label: 'Username',
          value: registerUsername,
          onChange: setRegisterUsername,
          placeholder: 'e.g. Alice'
        }),
        h(Field, {
          id: 'register-password',
          type: 'password',
          label: 'Password',
          value: registerPassword,
          onChange: setRegisterPassword,
          placeholder: 'Minimum 6 characters'
        }),
        h('button', { type: 'submit' }, 'Register')
      ),
      h(
        'form',
        { className: 'card', onSubmit: handleLogin },
        h('h2', null, 'Login'),
        h(Field, {
          id: 'login-username',
          label: 'Username',
          value: loginUsername,
          onChange: setLoginUsername,
          placeholder: 'Can include spaces/case'
        }),
        h(Field, {
          id: 'login-password',
          type: 'password',
          label: 'Password',
          value: loginPassword,
          onChange: setLoginPassword,
          placeholder: 'Your password'
        }),
        h('button', { type: 'submit' }, 'Login')
      )
    ),
    result &&
      h(
        'section',
        { className: 'card result' },
        h('h2', null, 'Last Response'),
        h('p', null, h('strong', null, 'Action: '), result.action),
        h('p', null, h('strong', null, 'Status: '), String(result.status)),
        h('p', null, h('strong', null, 'Message: '), result.message || result.error)
      )
  );
}
