document.addEventListener('DOMContentLoaded', function () {
    let exercisesList = []; 
    let selectedExercises = []; 

    const trainingDateInput = document.getElementById('trainingDate');
    const today = new Date().toISOString().split('T')[0];
    trainingDateInput.value = today;

    const fetchExercises = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${window.SERVER_URL}api/exercises`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            exercisesList = await response.json();
            populateExerciseSelect(exercisesList); 
        } catch (error) {
            console.error("Błąd przy ładowaniu ćwiczeń:", error);
        }
    };

    const populateExerciseSelect = (exercises) => {
        const exerciseSelect = document.getElementById('exerciseSelect');
        exerciseSelect.innerHTML = '<option value="">Wybierz ćwiczenie</option>'; 
        exercises.forEach(exercise => {
            const option = document.createElement('option');
            option.value = exercise.id; 
            option.textContent = exercise.name;
            exerciseSelect.appendChild(option);
        });
    };

    const filterExercisesByMuscleGroup = (muscleGroup) => {
        if (muscleGroup === 'wszystkie' || muscleGroup === '') {
            populateExerciseSelect(exercisesList);
        } else {
            const filteredExercises = exercisesList.filter(exercise => exercise.muscle_group === muscleGroup);
            populateExerciseSelect(filteredExercises);
        }
    };

    const addExerciseToList = (exercise) => {
        const isExerciseAlreadyAdded = selectedExercises.some(e => e.id === exercise.id);
        if (isExerciseAlreadyAdded) {
            alert('To ćwiczenie zostało już dodane!');
            return; 
        }

        const exerciseList = document.getElementById('addedExercisesList');
        const li = document.createElement('li');
        li.classList.add('exercise-item');
        
        const descriptionText = exercise.description ? `<p><strong>Opis ćwiczenia:</strong> ${exercise.description}</p>` : '<p><strong>Brak opisu</strong></p>';
        
        li.innerHTML = `
            <div class="exercise-name">${exercise.name}</div>
            <div class="muscle-group">${exercise.muscle_group || 'Brak danych'}</div>
            Aktualny ciężar: <input type="number" value="${exercise.current_weight || ''}" class="weightInput" data-id="${exercise.id}"><br>
            ${descriptionText}  <!-- Wyświetlamy istniejący opis -->
            Opis do encji asocjacyjnej: <textarea class="descriptionInput" data-id="${exercise.id}" placeholder="Dodaj opis ćwiczenia"></textarea><br>
            ${exercise.image_one ? `<img src="http://127.0.0.1:3000${exercise.image_one}" style="width: 100px; height: 100px; margin: 5px;">` : ''}
            ${exercise.image_two ? `<img src="http://127.0.0.1:3000${exercise.image_two}" style="width: 100px; height: 100px; margin: 5px;">` : ''}
            <button class="removeExerciseBtn" data-id="${exercise.id}">Usuń</button>
        `;
        exerciseList.appendChild(li);
        selectedExercises.push(exercise);  
    };

    const removeExerciseFromList = (exerciseId) => {
        selectedExercises = selectedExercises.filter(e => e.id !== exerciseId);

        const exerciseList = document.getElementById('addedExercisesList');
        const exerciseItem = exerciseList.querySelector(`button[data-id="${exerciseId}"]`).closest('li');
        if (exerciseItem) {
            exerciseItem.remove();
        }
    };

    fetchExercises();

    document.getElementById('addedExercisesList').addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('removeExerciseBtn')) {
            const exerciseId = parseInt(e.target.getAttribute('data-id')); 
            removeExerciseFromList(exerciseId); 
            e.stopPropagation();  
        }
    });

    document.getElementById('addExerciseBtn').addEventListener('click', async function () {
        const exerciseSelect = document.getElementById('exerciseSelect');
        const selectedExerciseId = parseInt(exerciseSelect.value);

        if (selectedExerciseId) {
            const exercise = exercisesList.find(e => e.id === selectedExerciseId);
            if (exercise) {
                addExerciseToList(exercise);
            }
        }
    });

    document.getElementById('muscleGroupSelect').addEventListener('change', function () {
        const selectedMuscleGroup = this.value;
        filterExercisesByMuscleGroup(selectedMuscleGroup);
    });

    const trainingForm = document.getElementById('trainingForm');
    trainingForm.addEventListener('submit', async (event) => {
        event.preventDefault();  
    
        const trainingDate = document.getElementById('trainingDate').value;
        const location = document.getElementById('location').value;
    
        const exercisesWithDetails = selectedExercises.map(exercise => {
            const weightInput = document.querySelector(`.weightInput[data-id="${exercise.id}"]`);
            const descriptionInput = document.querySelector(`.descriptionInput[data-id="${exercise.id}"]`);
            const weight = weightInput ? parseFloat(weightInput.value) : null;
            const description = descriptionInput ? descriptionInput.value : null;
    
            return {
                exercise_id: exercise.id,
                weight: weight,
                description: description
            };
        });
    
        const data = {
            date: trainingDate,
            location: location,
            exercises: exercisesWithDetails
        };
    
        console.log('Sending data to server:', data); 
    
        const token = localStorage.getItem('token');
        const response = await fetch(`${window.SERVER_URL}api/training-days`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
    
        if (response.ok) {
            alert('Dzień treningowy zapisany pomyślnie!');
        } else {
            alert('Błąd przy zapisywaniu dnia treningowego');
        }
    });
});
