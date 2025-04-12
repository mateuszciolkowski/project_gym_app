async function fetchTrainingDays() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${window.SERVER_URL}api/training-days`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    const trainingDaysList = document.getElementById('training-days-list');
    trainingDaysList.innerHTML = ''; 

    data.forEach(trainingDay => {
      const trainingDayElement = document.createElement('div');
      trainingDayElement.classList.add('training-day');

      const date = new Date(trainingDay.date);
      const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;

      const header = document.createElement('h2');
      header.textContent = `${formattedDate} - ${trainingDay.location}`;
      trainingDayElement.appendChild(header);

      const exerciseList = document.createElement('div');
      exerciseList.classList.add('exercise-list');

      if (trainingDay.exercises && trainingDay.exercises.length > 0) {
        trainingDay.exercises.forEach(exercise => {
          const exerciseItem = document.createElement('div');
          exerciseItem.classList.add('exercise-item');
          
          const exerciseText = document.createElement('p');
          exerciseText.innerHTML = `<span>${exercise.name}</span>: Wykonano z wagą ${exercise.current_training_day_weight ? exercise.current_training_day_weight : 'Brak danych'} kg`; // Waga z encji asocjacyjnej
          exerciseItem.appendChild(exerciseText);
          
          exerciseList.appendChild(exerciseItem);
        });
      } else {
        const noExercisesMessage = document.createElement('p');
        noExercisesMessage.textContent = 'No exercises assigned. Add exercises.';
        exerciseList.appendChild(noExercisesMessage);
      }

      trainingDayElement.appendChild(exerciseList);

      const buttonsContainer = document.createElement('div');
      buttonsContainer.classList.add('buttons-container');

      const editBtn = document.createElement('button');
      editBtn.classList.add('btn');
      editBtn.textContent = 'Edytuj';
      editBtn.addEventListener('click', () => openEditModal(trainingDay)); 

      const deleteBtn = document.createElement('button');
      deleteBtn.classList.add('btn');
      deleteBtn.textContent = 'Usuń';
      deleteBtn.addEventListener('click', () => deleteTrainingDay(trainingDay.id)); 

      buttonsContainer.appendChild(editBtn);
      buttonsContainer.appendChild(deleteBtn);

      trainingDayElement.appendChild(buttonsContainer);
      
      trainingDaysList.appendChild(trainingDayElement);
    });
  } catch (error) {
    console.error('There was a problem with the fetch operation:', error);
    alert('Nie udało się pobrać dni treningowych. Sprawdź połączenie z serwerem.');
  }
}

function openEditModal(trainingDay) {
  const modal = document.getElementById('editTrainingDayModal');
  const trainingDateInput = document.getElementById('editTrainingDate');
  const locationInput = document.getElementById('editLocation');
  const muscleGroupSelect = document.getElementById('editMuscleGroupSelect');
  const exercisesSelect = document.getElementById('editExerciseSelect');
  const addedExercisesList = document.getElementById('editAddedExercisesList');
  
  trainingDateInput.value = new Date(trainingDay.date).toISOString().split('T')[0]; 
  locationInput.value = trainingDay.location;
  
  addedExercisesList.innerHTML = '';
  
  trainingDay.exercises.forEach(exercise => {
    const li = document.createElement('li');
    li.innerHTML = `
      ${exercise.name} - Waga: <input type="number" value="${exercise.current_training_day_weight}" class="editWeightInput" data-id="${exercise.id}">
      Opis: <textarea class="editDescriptionInput" data-id="${exercise.id}">${exercise.training_day_description}</textarea>
      <button class="removeExerciseBtn" data-id="${exercise.id}">Usuń</button>
    `;
    addedExercisesList.appendChild(li);
  });

  modal.style.display = 'flex'; 

  const token = localStorage.getItem('token');
  fetch(`${window.SERVER_URL}api/exercises`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Unauthorized');
      }
      return response.json();
    })
    .then(exercises => {
      exercisesSelect.innerHTML = '<option value="">Wybierz ćwiczenie</option>';
      exercises.forEach(exercise => {
        const option = document.createElement('option');
        option.value = exercise.id;
        option.textContent = exercise.name;
        exercisesSelect.appendChild(option);
      });

      muscleGroupSelect.innerHTML = `
        <option value="all">Wszystkie</option>
        <option value="klatka piersiowa">Klatka piersiowa</option>
        <option value="plecy">Plecy</option>
        <option value="barki">Barki</option>
        <option value="biceps">Biceps</option>  
        <option value="triceps">Triceps</option>  
        <option value="nogi">Nogi</option>
        <option value="brzuch">Brzuch</option>
        <option value="łydki">Łydki</option>
        <option value="przedramiona">Przedramiona</option>
        <option value="pośladki">Pośladki</option>
      `;

      muscleGroupSelect.addEventListener('change', () => {
        const selectedGroup = muscleGroupSelect.value;
        exercisesSelect.innerHTML = '<option value="">Wybierz ćwiczenie</option>';
        exercises
          .filter(ex => selectedGroup === 'all' || ex.muscle_group === selectedGroup)
          .forEach(exercise => {
            const option = document.createElement('option');
            option.value = exercise.id;
            option.textContent = exercise.name;
            exercisesSelect.appendChild(option);
          });
      });
    })
    .catch(error => {
      console.error('Error fetching exercises:', error);
      alert('Nie udało się pobrać ćwiczeń. Sprawdź połączenie z serwerem.');
    });

  document.getElementById('saveEditedTrainingDayBtn').addEventListener('click', async () => {
    const updatedExercises = Array.from(addedExercisesList.children).map(li => {
      const exerciseId = parseInt(li.querySelector('.editWeightInput').getAttribute('data-id'));
      const weight = parseFloat(li.querySelector('.editWeightInput').value);
      const description = li.querySelector('.editDescriptionInput').value;
      return { exercise_id: exerciseId, weight, description };
    });

    const updatedTrainingDay = {
      date: trainingDateInput.value,
      location: locationInput.value,
      exercises: updatedExercises 
    };

    console.log('Sending updated training day data:', updatedTrainingDay); 

    const token = localStorage.getItem('token');
   if (window.SERVER_URL && trainingDay.id) {
  const response = await fetch(`${window.SERVER_URL}api/training-days/${trainingDay.id}`, {
    method: 'PUT', 
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify(updatedTrainingDay) 
  });

  if (response.ok) {
    alert('Dzień treningowy zaktualizowany');
  } else {
    alert('Błąd przy edytowaniu dnia treningowego');
  }
} else {
  console.error('Błąd: Brak SERVER_URL lub ID dnia treningowego');
}

  });

  document.getElementById('cancelEditTrainingDayBtn').addEventListener('click', () => {
    modal.style.display = 'none'; 
  });

  addedExercisesList.addEventListener('click', (e) => {
    if (e.target && e.target.classList.contains('removeExerciseBtn')) {
      const exerciseId = parseInt(e.target.getAttribute('data-id'));
      const li = e.target.closest('li');
      li.remove(); 
      trainingDay.exercises = trainingDay.exercises.filter(ex => ex.id !== exerciseId); 
    }
  });

  document.getElementById('addNewExerciseBtn').addEventListener('click', async () => {
    const selectedExerciseId = parseInt(exercisesSelect.value);
    if (selectedExerciseId) {
      const isExerciseAlreadyAdded = Array.from(addedExercisesList.children).some(li => {
        return parseInt(li.querySelector('.editWeightInput').getAttribute('data-id')) === selectedExerciseId;
      });

      if (isExerciseAlreadyAdded) {
        alert('To ćwiczenie zostało już dodane!');
        return; 
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${window.SERVER_URL}api/exercises/${selectedExerciseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Unauthorized');
      }

      const exercise = await response.json();
      trainingDay.exercises.push({
        id: exercise.id,
        name: exercise.name,
        muscle_group: exercise.muscle_group,
        current_training_day_weight: exercise.current_weight || 0,
        training_day_description: ''
      });
      const li = document.createElement('li');
      li.innerHTML = `
        ${exercise.name} - Waga: <input type="number" value="${exercise.current_weight || 0}" class="editWeightInput" data-id="${exercise.id}">
        Opis: <textarea class="editDescriptionInput" data-id="${exercise.id}"></textarea>
        <button class="removeExerciseBtn" data-id="${exercise.id}">Usuń</button>
      `;
      addedExercisesList.appendChild(li);
    }
  });
}

async function deleteTrainingDay(trainingDayId) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${window.SERVER_URL}api/training-days/${trainingDayId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (response.ok) {
    alert('Dzień treningowy usunięty');
    location.reload(); 
  } else {
    alert('Błąd przy usuwaniu dnia treningowego');
  }
}

fetchTrainingDays();
