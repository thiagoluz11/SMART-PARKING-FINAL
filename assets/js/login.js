// Quando o botão de login for clicado, enviar os dados para o servidor
const loginButton = document.getElementsByClassName('btn btn-primary')[0];

loginButton.addEventListener('click', async (e) => {
  e.preventDefault();
  
  // Apanhar os dados do formulário de login
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();

  try{
    const response = await fetch('http://localhost:3000/users/login',{
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email,password})
    })
    const data = await response.json();
    if(response.ok){
      localStorage.setItem('user',JSON.stringify(data.user)); // CORRIGIDO: data.user em vez de data
      localStorage.setItem('token',data.token);      // Guardar o token de autenticação no localStorage
       
    }else{
      View.showPopup({ title: 'Erro de login', message: data.error, type: 'error' });
      return;
    }
    // Se o login correr bem o user será redrecionado para a página de perfil
    const dest = data.user.role?.toUpperCase() === 'ADMIN' ? 'admin.html' : 'profile.html';
    View.showPopup({ title: 'Bem-vindo!', message: 'Login realizado com sucesso.', type: 'success', redirect: dest });
 
  }catch(err){
    console.error('Error:', err);
    View.showPopup({ title: 'Erro de ligação', message: 'Não foi possível ligar ao servidor. Tente novamente mais tarde.', type: 'error' });
  }
});

// Alternar visibilidade da palavra-passe
const togglePwd = document.getElementById('toggle-password');
const pwdInput  = document.getElementById('login-password');

const eyeOpenSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/>
  <circle cx="12" cy="12" r="3"/>
</svg>
`;

const eyeClosedSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M 3 10 Q 12 20 21 10" />
  <path d="M 4 11 L 2 14" />
  <path d="M 7.5 13.5 L 5.5 17.5" />
  <path d="M 12 15 L 12 19.5" />
  <path d="M 16.5 13.5 L 18.5 17.5" />
  <path d="M 20 11 L 22 14" />
</svg>
`;

togglePwd?.addEventListener('click', () => {
  pwdInput.type = pwdInput.type === 'password' ? 'text' : 'password';
  togglePwd.innerHTML = pwdInput.type === 'password' ? eyeClosedSVG : eyeOpenSVG;
});