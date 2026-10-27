class ApiService {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  async _request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const defaultHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg = data && data.error ? data.error : `HTTP ${response.status}: Request failed`;
        const err = new Error(errorMsg);
        err.status = response.status;
        err.data = data;
        throw err;
      }

      return data;
    } catch (err) {
      if (!err.status) {
        err.message = `Network error: ${err.message}`;
      }
      throw err;
    }
  }

  getStudents(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.group) query.set('group', params.group);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this._request(`/students${queryString}`);
  }

  getStudent(id) {
    return this._request(`/students/${id}`);
  }

  createStudent(studentData) {
    return this._request('/students', {
      method: 'POST',
      body: studentData
    });
  }

  updateStudent(id, studentData) {
    return this._request(`/students/${id}`, {
      method: 'PUT',
      body: studentData
    });
  }

  deleteStudent(id) {
    return this._request(`/students/${id}`, {
      method: 'DELETE'
    });
  }

  getStudentPayments(studentId) {
    return this._request(`/students/${studentId}/payments`);
  }

  createPayment(paymentData) {
    return this._request('/payments', {
      method: 'POST',
      body: paymentData
    });
  }

  getDebtors(month) {
    return this._request(`/debtors?month=${encodeURIComponent(month)}`);
  }
}

window.api = new ApiService();
