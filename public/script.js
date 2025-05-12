// Handle payment mode changes
document.getElementById('paymentMode').addEventListener('change', e => {
  const paymentStatus = document.getElementById('paymentStatus');
  const concessionAmountRow = document.getElementById('concessionAmountRow');
  
  if (e.target.value === 'concession') {
    concessionAmountRow.style.display = 'table-row';
    paymentStatus.value = '';
    paymentStatus.disabled = false;
  } else {
    concessionAmountRow.style.display = 'none';
    paymentStatus.disabled = false;
  }
  
  // Trigger payment status change event to update due amount field
  paymentStatus.dispatchEvent(new Event('change'));
});

// Show/hide due amount field based on payment status
document.getElementById('paymentStatus').addEventListener('change', e => {
  const dueAmountRow = document.getElementById('dueAmountRow');
  const dueAmountInput = document.querySelector('input[name="due_amount"]');
  
  if (e.target.value === 'partial') {
    dueAmountRow.style.display = 'table-row';
    dueAmountInput.required = true;
  } else {
    dueAmountRow.style.display = 'none';
    dueAmountInput.required = false;
    dueAmountInput.value = '';
  }
});

// Create loading overlay
const loadingOverlay = document.createElement('div');
loadingOverlay.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:9999;';
loadingOverlay.innerHTML = `
  <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center; color:white;">
    <div class="spinner-border" role="status"></div>
    <div style="margin-top:10px">Processing registration...</div>
  </div>
`;
document.body.appendChild(loadingOverlay);

document.getElementById('regForm').addEventListener('submit', async e => {
  e.preventDefault();
  
  // Show loading overlay
  loadingOverlay.style.display = 'block';
  
  try {
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Convert checkbox value to boolean
    data.send_whatsapp = formData.has('send_whatsapp');
    
    // Set due_amount to 0 for full payment
    if (data.payment_status === 'full') {
      data.due_amount = 0;
    }

    const res = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json());

    if (res.ok) {
      // Redirect to print page with all form data
      const params = new URLSearchParams({
        ...data,
        id: res.id,
        print: 'true'
      });
      window.location.href = `/print.html?${params.toString()}`;
    } else {
      throw new Error('Registration failed');
    }
  } catch (error) {
    // Hide loading overlay
    loadingOverlay.style.display = 'none';
    alert('Error — see console.');
    console.error(error);
  }
});
  