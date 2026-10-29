const StudentRepository = require('../repositories/studentRepository');
const { validateStudentInput } = require('../utils/validation');
const { NotFoundError, ValidationError, BadRequestError } = require('../utils/errors');

class StudentService {
  constructor(studentRepository = new StudentRepository()) {
    this.studentRepo = studentRepository;
  }

  _parseId(id) {
    const numId = Number(id);
    if (!Number.isInteger(numId) || numId <= 0) {
      throw new BadRequestError('Invalid student ID. ID must be a positive integer.');
    }
    return numId;
  }

  async getAllStudents(filters = {}) {
    return await this.studentRepo.findAll(filters);
  }

  async getStudentById(id) {
    const numId = this._parseId(id);
    const student = await this.studentRepo.findById(numId);
    if (!student) {
      throw new NotFoundError(`Student with ID ${numId} was not found.`);
    }
    return student;
  }

  async createStudent(data) {
    const validation = validateStudentInput(data, false);
    if (!validation.valid) {
      throw new ValidationError(validation.errors.join(' '), validation.errors);
    }
    return await this.studentRepo.create(validation.data);
  }

  async updateStudent(id, data) {
    const numId = this._parseId(id);
    const existing = await this.studentRepo.findById(numId);
    if (!existing) {
      throw new NotFoundError(`Student with ID ${numId} was not found.`);
    }

    const validation = validateStudentInput(data, true);
    if (!validation.valid) {
      throw new ValidationError(validation.errors.join(' '), validation.errors);
    }

    if (Object.keys(validation.data).length === 0) {
      throw new ValidationError('At least one field must be provided to update.');
    }

    return await this.studentRepo.update(numId, validation.data);
  }

  async deleteStudent(id) {
    const numId = this._parseId(id);
    const existing = await this.studentRepo.findById(numId);
    if (!existing) {
      throw new NotFoundError(`Student with ID ${numId} was not found.`);
    }
    await this.studentRepo.delete(numId);
    return {
      success: true,
      message: `Student with ID ${numId} and all associated payment records were deleted successfully.`
    };
  }
}

module.exports = StudentService;

