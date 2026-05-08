// Fetch and display courses on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('http://localhost:3000/api/courses');
        const courses = await response.json();
        
        const tbody = document.getElementById('course-table-body');
        
        courses.forEach(course => {
            const seatsLeft = course.capacity - course.enrolled_count;
            const btnClass = seatsLeft > 0 ? 'btn-success' : 'btn-secondary disabled';
            const btnText = seatsLeft > 0 ? 'Enroll' : 'Full';

            tbody.innerHTML += `
                <tr>
                    <td>${course.code}</td>
                    <td>${course.title}</td>
                    <td>${course.credits}</td>
                    <td>${course.days} ${course.start_time}</td>
                    <td>${seatsLeft} / ${course.capacity}</td>
                    <td>
                        <button class="btn ${btnClass} btn-sm" 
                                onclick="enrollCourse(${course.schedule_id})"
                                ${seatsLeft === 0 ? 'disabled' : ''}>
                            ${btnText}
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error fetching courses:', error);
    }
});

// Handle Enrollment Button Click
async function enrollCourse(scheduleId) {
    // In a real app, student ID comes from the decoded JWT token
    const studentId = 1; 

    try {
        const response = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ student_id: studentId, schedule_id: scheduleId })
        });

        const result = await response.json();
        const alertDiv = document.getElementById('alerts');

        if (response.ok) {
            alertDiv.innerHTML = `<div class="alert alert-success">${result.message}</div>`;
            setTimeout(() => location.reload(), 1500); // Reload to update seat count
        } else {
            alertDiv.innerHTML = `<div class="alert alert-danger">${result.error}</div>`;
        }
    } catch (error) {
        alert('An error occurred during registration.');
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}