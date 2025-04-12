document.getElementById('exercise-form').addEventListener('submit', async function(event) {
  event.preventDefault(); 

  const name = document.getElementById('name').value;
  const muscleGroup = document.getElementById('muscle-group').value;
  const currentWeight = parseFloat(document.getElementById('current-weight').value);
  const maxWeight = document.getElementById('max-weight').value ? parseFloat(document.getElementById('max-weight').value) : null;
  
  const maxWeightDate = document.getElementById('max-weight-date').value.trim();
  const validMaxWeightDate = maxWeightDate !== "" ? maxWeightDate : null;  

  const description = document.getElementById('description').value;

  const formData = new FormData();
  formData.append('name', name);
  formData.append('muscleGroup', muscleGroup);
  formData.append('currentWeight', currentWeight);
  formData.append('maxWeight', maxWeight);  
  formData.append('maxWeightDate', validMaxWeightDate);
  formData.append('description', description); 

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(window.SERVER_URL+'api/exercises', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (response.ok) {
      const newExercise = await response.json();
      alert('Ćwiczenie zostało dodane!');
    } else {
      throw new Error('Błąd serwera');
    }
  } catch (error) {
    alert('Wystąpił błąd: ' + error.message);
    console.error(error);
  }
});
