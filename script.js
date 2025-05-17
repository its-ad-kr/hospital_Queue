// Queue Management System
class QueueSystem {
    constructor() {
        this.queue = [];
        this.waitingRoomCapacity = 20;
        this.currentPosition = 1;
        this.staffCredentials = {
            'admin': 'admin123',
            'staff1': 'staff123',
            'staff2': 'staff123'
        };
        this.isStaffLoggedIn = false;
        this.initializeEventListeners();
        this.loadFromLocalStorage();
    }

    initializeEventListeners() {
        // Tab switching
        document.getElementById('patientTab').addEventListener('click', () => this.switchTab('patient'));
        document.getElementById('staffTab').addEventListener('click', () => this.switchTab('staff'));

        // Patient form submission
        document.getElementById('patientForm').addEventListener('submit', (e) => this.handlePatientSubmission(e));

        // Staff authentication
        document.getElementById('staffAuthForm').addEventListener('submit', (e) => this.handleStaffLogin(e));
        document.getElementById('staffLogout').addEventListener('click', () => this.handleStaffLogout());

        // Staff actions
        document.getElementById('updateCapacity').addEventListener('click', () => this.updateWaitingRoomCapacity());
        document.getElementById('callNextPatient').addEventListener('click', () => this.callNextPatient());
        document.getElementById('pauseQueue').addEventListener('click', () => this.toggleQueuePause());
        document.getElementById('clearQueue').addEventListener('click', () => this.clearQueue());
    }

    switchTab(tab) {
        const patientPortal = document.getElementById('patientPortal');
        const staffPortal = document.getElementById('staffPortal');
        const patientTab = document.getElementById('patientTab');
        const staffTab = document.getElementById('staffTab');

        if (tab === 'patient') {
            patientPortal.classList.remove('d-none');
            staffPortal.classList.add('d-none');
            patientTab.classList.add('active');
            staffTab.classList.remove('active');
        } else {
            patientPortal.classList.add('d-none');
            staffPortal.classList.remove('d-none');
            patientTab.classList.remove('active');
            staffTab.classList.add('active');
            
            // Reset staff login state when switching to staff tab
            if (!this.isStaffLoggedIn) {
                this.showStaffLoginForm();
            }
        }
    }

    handleStaffLogin(e) {
        e.preventDefault();
        
        const staffId = document.getElementById('staffId').value;
        const password = document.getElementById('staffPassword').value;

        if (this.authenticateStaff(staffId, password)) {
            this.isStaffLoggedIn = true;
            this.showStaffDashboard();
            this.showNotification('Staff login successful', 'success');
        } else {
            this.showNotification('Invalid staff ID or password', 'error');
        }
    }

    handleStaffLogout() {
        this.isStaffLoggedIn = false;
        this.showStaffLoginForm();
        this.showNotification('Staff logged out successfully', 'info');
    }

    authenticateStaff(staffId, password) {
        return this.staffCredentials[staffId] === password;
    }

    showStaffLoginForm() {
        document.getElementById('staffLoginForm').classList.remove('d-none');
        document.getElementById('staffDashboard').classList.add('d-none');
    }

    showStaffDashboard() {
        document.getElementById('staffLoginForm').classList.add('d-none');
        document.getElementById('staffDashboard').classList.remove('d-none');
    }

    handlePatientSubmission(e) {
        e.preventDefault();
        
        const name = document.getElementById('patientName').value;
        const phone = document.getElementById('patientPhone').value;
        const department = document.getElementById('department').value;
        const priority = document.getElementById('priority').value;
        const description = document.getElementById('description').value;

        if (this.queue.length >= this.waitingRoomCapacity) {
            this.showNotification('Waiting room is at full capacity. Please try again later.', 'warning');
            return;
        }

        const patient = {
            id: Date.now(),
            name,
            phone,
            department,
            priority,
            description,
            position: this.currentPosition++,
            status: 'waiting',
            timestamp: new Date().toISOString()
        };

        this.queue.push(patient);
        this.saveToLocalStorage();
        this.updateQueueDisplay();
        this.updateStaffQueueDisplay();
        this.showNotification(`Added to queue: ${name} - Position: ${patient.position}`);

        // Reset form
        e.target.reset();
    }

    updateWaitingRoomCapacity() {
        const newCapacity = parseInt(document.getElementById('capacityInput').value);
        if (newCapacity > 0) {
            this.waitingRoomCapacity = newCapacity;
            this.saveToLocalStorage();
            this.showNotification(`Waiting room capacity updated to ${newCapacity}`);
        } else {
            this.showNotification('Please enter a valid capacity number', 'error');
        }
    }

    callNextPatient() {
        const waitingPatients = this.queue.filter(p => p.status === 'waiting');
        if (waitingPatients.length === 0) {
            this.showNotification('No patients waiting in queue', 'info');
            return;
        }

        const nextPatient = waitingPatients[0];
        nextPatient.status = 'called';
        this.saveToLocalStorage();
        this.updateQueueDisplay();
        this.updateStaffQueueDisplay();
        this.showNotification(`Called next patient: ${nextPatient.name}`);
    }

    toggleQueuePause() {
        const pauseBtn = document.getElementById('pauseQueue');
        const isPaused = pauseBtn.classList.contains('btn-danger');
        
        if (isPaused) {
            pauseBtn.classList.remove('btn-danger');
            pauseBtn.classList.add('btn-warning');
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause Queue';
            this.showNotification('Queue resumed', 'success');
        } else {
            pauseBtn.classList.remove('btn-warning');
            pauseBtn.classList.add('btn-danger');
            pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume Queue';
            this.showNotification('Queue paused', 'warning');
        }
    }

    completePatient(patientId) {
        const patient = this.queue.find(p => p.id === patientId);
        if (patient) {
            patient.status = 'completed';
            this.saveToLocalStorage();
            this.updateQueueDisplay();
            this.updateStaffQueueDisplay();
            this.showNotification(`Completed treatment for: ${patient.name}`);
        }
    }

    updateQueueDisplay() {
        const queueList = document.getElementById('queueList');
        const totalPatients = document.getElementById('totalPatients');
        const avgWaitTime = document.getElementById('avgWaitTime');
        const yourPosition = document.getElementById('yourPosition');
        const waitingPatients = this.queue.filter(p => p.status === 'waiting');

        // Update stats
        totalPatients.textContent = waitingPatients.length;
        avgWaitTime.textContent = this.calculateAverageWaitTime();
        yourPosition.textContent = this.getCurrentPatientPosition();

        // Update queue list
        queueList.innerHTML = '';
        waitingPatients.forEach(patient => {
            const queueItem = document.createElement('div');
            queueItem.className = 'queue-item';
            queueItem.innerHTML = `
                <div>
                    <span class="position">#${patient.position}</span>
                    <span class="name">${patient.name}</span>
                    <span class="department">${patient.department}</span>
                </div>
                <span class="status status-${patient.status}">${patient.status}</span>
            `;
            queueList.appendChild(queueItem);
        });
    }

    updateStaffQueueDisplay() {
        const staffQueueList = document.getElementById('staffQueueList');
        staffQueueList.innerHTML = '';

        this.queue.forEach(patient => {
            const row = document.createElement('tr');
            const waitTime = this.calculateWaitTime(patient.timestamp);
            row.innerHTML = `
                <td>#${patient.position}</td>
                <td>${patient.name}</td>
                <td>${patient.department}</td>
                <td><span class="badge bg-${this.getPriorityColor(patient.priority)}">${patient.priority}</span></td>
                <td>${waitTime} min</td>
                <td><span class="status status-${patient.status}">${patient.status}</span></td>
                <td>
                    ${patient.status === 'called' ? 
                        `<button class="btn btn-sm btn-success" onclick="queueSystem.completePatient(${patient.id})">
                            Complete
                        </button>` : 
                        ''}
                </td>
            `;
            staffQueueList.appendChild(row);
        });
    }

    calculateAverageWaitTime() {
        const waitingPatients = this.queue.filter(p => p.status === 'waiting');
        if (waitingPatients.length === 0) return 0;

        const totalWaitTime = waitingPatients.reduce((sum, patient) => {
            return sum + this.calculateWaitTime(patient.timestamp);
        }, 0);

        return Math.round(totalWaitTime / waitingPatients.length);
    }

    calculateWaitTime(timestamp) {
        const now = new Date();
        const patientTime = new Date(timestamp);
        return Math.round((now - patientTime) / (1000 * 60)); // Convert to minutes
    }

    getCurrentPatientPosition() {
        // In a real system, this would be based on the logged-in patient
        return '-';
    }

    getPriorityColor(priority) {
        switch (priority) {
            case 'emergency': return 'danger';
            case 'urgent': return 'warning';
            default: return 'info';
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed bottom-0 end-0 m-3`;
        notification.style.zIndex = '1000';
        notification.style.minWidth = '300px';
        notification.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    }

    saveToLocalStorage() {
        localStorage.setItem('queueSystem', JSON.stringify({
            queue: this.queue,
            waitingRoomCapacity: this.waitingRoomCapacity,
            currentPosition: this.currentPosition
        }));
    }

    loadFromLocalStorage() {
        const savedData = localStorage.getItem('queueSystem');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.queue = data.queue;
            this.waitingRoomCapacity = data.waitingRoomCapacity;
            this.currentPosition = data.currentPosition;
            this.updateQueueDisplay();
            this.updateStaffQueueDisplay();
        }
    }

    clearQueue() {
        if (confirm('Are you sure you want to clear the entire queue? This action cannot be undone.')) {
            this.queue = [];
            this.currentPosition = 1;
            this.saveToLocalStorage();
            this.updateQueueDisplay();
            this.updateStaffQueueDisplay();
            this.showNotification('Queue has been cleared successfully', 'success');
        }
    }
}

// Initialize the queue system
const queueSystem = new QueueSystem();

// Patient Portal Implementation
class PatientPortal {
    constructor() {
        this.authService = new AuthService();
        this.appointmentService = new AppointmentService();
        this.notificationService = new NotificationService();
        this.initializeElements();
        this.setupEventListeners();
        this.currentPatient = null;
    }

    initializeElements() {
        // Auth Selection
        this.authSelection = document.getElementById('authSelection');
        this.loginBtn = document.getElementById('loginBtn');
        this.signupBtn = document.getElementById('signupBtn');

        // Login Form
        this.loginForm = document.getElementById('loginForm');
        this.loginFormElement = document.getElementById('loginFormElement');
        this.loginIdentifier = document.getElementById('loginIdentifier');
        this.loginOtpSection = document.getElementById('loginOtpSection');
        this.loginOtp = document.getElementById('loginOtp');
        this.verifyLoginOtpBtn = document.getElementById('verifyLoginOtp');
        this.backToSignupBtn = document.getElementById('backToSignup');
        this.backToLoginBtn = document.getElementById('backToLogin');

        // Signup Forms
        this.signupFormStep1 = document.getElementById('signupFormStep1');
        this.signupFormStep2 = document.getElementById('signupFormStep2');
        this.signupFormElement = document.getElementById('signupFormElement');
        this.signupOtpForm = document.getElementById('signupOtpForm');
        this.signupOtp = document.getElementById('signupOtp');
        this.backToAuthBtn = document.getElementById('backToAuth');
        this.backToSignupStep1Btn = document.getElementById('backToSignupStep1');

        // Patient Dashboard
        this.patientDashboard = document.getElementById('patientDashboard');
        this.patientProfileInfo = document.getElementById('patientProfileInfo');
        this.editProfileBtn = document.getElementById('editProfileBtn');
        this.appointmentForm = document.getElementById('appointmentForm');
        this.offlinePayment = document.getElementById('offlinePayment');
        this.onlinePayment = document.getElementById('onlinePayment');
        this.onlinePaymentSection = document.getElementById('onlinePaymentSection');
        this.transactionId = document.getElementById('transactionId');

        // Tab switching
        this.patientTab = document.getElementById('patientTab');
        this.staffTab = document.getElementById('staffTab');
        this.staffPortal = document.getElementById('staffPortal');
        this.patientPortal = document.getElementById('patientPortal');
    }

    setupEventListeners() {
        // Tab switching
        this.patientTab.addEventListener('click', () => this.switchTab('patient'));
        this.staffTab.addEventListener('click', () => this.switchTab('staff'));

        // Auth Selection
        this.loginBtn.addEventListener('click', () => this.showLoginForm());
        this.signupBtn.addEventListener('click', () => this.showSignupFormStep1());

        // Login Form
        this.loginFormElement.addEventListener('submit', (e) => this.handleLoginSubmit(e));
        this.verifyLoginOtpBtn.addEventListener('click', () => this.verifyLoginOtp());
        this.backToSignupBtn.addEventListener('click', () => this.showAuthSelection());
        this.backToLoginBtn.addEventListener('click', () => this.showLoginForm());

        // Signup Forms
        this.signupFormElement.addEventListener('submit', (e) => this.handleSignupStep1(e));
        this.signupOtpForm.addEventListener('submit', (e) => this.handleSignupStep2(e));
        this.backToAuthBtn.addEventListener('click', () => this.showAuthSelection());
        this.backToSignupStep1Btn.addEventListener('click', () => this.showSignupFormStep1());

        // Patient Dashboard
        this.editProfileBtn.addEventListener('click', () => this.editProfile());
        this.appointmentForm.addEventListener('submit', (e) => this.handleAppointmentSubmit(e));
        this.onlinePayment.addEventListener('change', () => this.toggleOnlinePayment());
        this.offlinePayment.addEventListener('change', () => this.toggleOnlinePayment());
    }

    switchTab(tab) {
        if (tab === 'patient') {
            this.patientPortal.classList.remove('d-none');
            this.staffPortal.classList.add('d-none');
            this.patientTab.classList.add('active');
            this.staffTab.classList.remove('active');
        } else {
            this.patientPortal.classList.add('d-none');
            this.staffPortal.classList.remove('d-none');
            this.patientTab.classList.remove('active');
            this.staffTab.classList.add('active');
        }
    }

    showAuthSelection() {
        this.hideAllForms();
        this.authSelection.classList.remove('d-none');
    }

    showLoginForm() {
        this.hideAllForms();
        this.loginForm.classList.remove('d-none');
        this.loginOtpSection.classList.add('d-none');
    }

    showSignupFormStep1() {
        this.hideAllForms();
        this.signupFormStep1.classList.remove('d-none');
    }

    hideAllForms() {
        this.authSelection.classList.add('d-none');
        this.loginForm.classList.add('d-none');
        this.loginOtpSection.classList.add('d-none');
        this.signupFormStep1.classList.add('d-none');
        this.signupFormStep2.classList.add('d-none');
        this.patientDashboard.classList.add('d-none');
    }

    async handleLoginSubmit(e) {
        e.preventDefault();
        const identifier = this.loginIdentifier.value;
        
        // Basic validation
        if (!identifier) {
            this.notificationService.showError('Please enter your mobile number or email');
            return;
        }

        try {
            await this.authService.sendLoginOtp(identifier);
            await this.notificationService.sendOTP(identifier, this.authService.otp);
            this.loginOtpSection.classList.remove('d-none');
            this.notificationService.showSuccess('OTP sent successfully!');
        } catch (error) {
            this.notificationService.showError('Failed to send OTP. Please try again.');
        }
    }

    async verifyLoginOtp() {
        const identifier = this.loginIdentifier.value;
        const otp = this.loginOtp.value;
        
        const patient = this.authService.verifyLoginOtp(identifier, otp);
        if (patient) {
            this.currentPatient = patient;
            this.showPatientDashboard(patient);
        } else {
            this.notificationService.showError('Invalid OTP. Please try again.');
        }
    }

    async handleSignupStep1(e) {
        e.preventDefault();
        const formData = {
            name: document.getElementById('signupName').value,
            phone: document.getElementById('signupPhone').value,
            email: document.getElementById('signupEmail').value,
            address: document.getElementById('signupAddress').value,
            dob: document.getElementById('signupDob').value,
            aadhaar: document.getElementById('signupAadhaar').value
        };

        // Validate form data
        if (this.validateSignupData(formData)) {
            try {
                await this.authService.sendSignupOtp(formData.phone);
                await this.notificationService.sendOTP(formData.phone, this.authService.otp);
                this.signupFormStep1.classList.add('d-none');
                this.signupFormStep2.classList.remove('d-none');
                this.notificationService.showSuccess('OTP sent to your registered mobile number');
            } catch (error) {
                this.notificationService.showError('Failed to send OTP. Please try again.');
            }
        }
    }

    validateSignupData(data) {
        // Phone number validation
        if (!/^[0-9]{10}$/.test(data.phone)) {
            this.notificationService.showError('Please enter a valid 10-digit mobile number');
            return false;
        }

        // Email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            this.notificationService.showError('Please enter a valid email address');
            return false;
        }

        // Aadhaar validation
        if (!/^[0-9]{12}$/.test(data.aadhaar)) {
            this.notificationService.showError('Please enter a valid 12-digit Aadhaar number');
            return false;
        }

        return true;
    }

    async handleSignupStep2(e) {
        e.preventDefault();
        const phone = document.getElementById('signupPhone').value;
        const otp = this.signupOtp.value;

        if (this.authService.verifySignupOtp(phone, otp)) {
            const formData = {
                name: document.getElementById('signupName').value,
                phone: phone,
                email: document.getElementById('signupEmail').value,
                address: document.getElementById('signupAddress').value,
                dob: document.getElementById('signupDob').value,
                aadhaar: document.getElementById('signupAadhaar').value
            };

            if (this.authService.registerPatient(formData)) {
                this.currentPatient = formData;
                this.showPatientDashboard(formData);
            } else {
                this.notificationService.showError('Registration failed. Patient may already exist.');
            }
        } else {
            this.notificationService.showError('Invalid OTP. Please try again.');
        }
    }

    showPatientDashboard(patientData) {
        this.currentPatient = patientData;
        this.hideAllForms();
        this.patientDashboard.classList.remove('d-none');
        this.updatePatientProfile();
        this.notificationService.showSuccess('Welcome to your dashboard!');
    }

    updatePatientProfile() {
        this.patientProfileInfo.innerHTML = `
            <p><i class="fas fa-user"></i> ${this.currentPatient.name}</p>
            <p><i class="fas fa-phone"></i> ${this.currentPatient.phone}</p>
            <p><i class="fas fa-envelope"></i> ${this.currentPatient.email}</p>
            <p><i class="fas fa-map-marker-alt"></i> ${this.currentPatient.address}</p>
            <p><i class="fas fa-birthday-cake"></i> ${this.currentPatient.dob}</p>
            <p><i class="fas fa-id-card"></i> ${this.currentPatient.aadhaar}</p>
        `;
    }

    editProfile() {
        this.notificationService.showInfo('Profile editing feature coming soon!');
    }

    toggleOnlinePayment() {
        this.onlinePaymentSection.classList.toggle('d-none', !this.onlinePayment.checked);
    }

    async handleAppointmentSubmit(e) {
        e.preventDefault();
        const appointmentData = {
            patientId: this.currentPatient.id,
            patientName: this.currentPatient.name,
            phone: this.currentPatient.phone,
            email: this.currentPatient.email,
            department: document.getElementById('appointmentDepartment').value,
            diseaseName: document.getElementById('diseaseName').value,
            priority: document.getElementById('conditionPriority').value,
            paymentMethod: this.onlinePayment.checked ? 'online' : 'offline',
            transactionId: this.transactionId.value
        };

        // Validate payment for online transactions
        if (appointmentData.paymentMethod === 'online' && !appointmentData.transactionId) {
            this.notificationService.showError('Please enter the transaction ID for online payment');
            return;
        }

        try {
            const appointment = this.appointmentService.createAppointment(appointmentData);
            
            // Process payment
            if (this.appointmentService.processPayment(appointment.id, appointmentData.paymentMethod, appointmentData.transactionId)) {
                // Send confirmation
                await this.notificationService.sendAppointmentConfirmation(appointment);
                
                this.notificationService.showSuccess('Appointment booked successfully! You will receive a confirmation message shortly.');
                this.appointmentForm.reset();
                this.onlinePaymentSection.classList.add('d-none');
            } else {
                this.notificationService.showError('Payment processing failed. Please try again.');
            }
        } catch (error) {
            this.notificationService.showError('Failed to book appointment. Please try again.');
        }
    }
}

// Initialize the patient portal when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const patientPortal = new PatientPortal();
}); 