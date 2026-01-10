/**
 * Validation utilities for Aoneko Move
 */

export const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

export const validatePhone = (phone: string): boolean => {
    // Basic Japanese phone number validation
    const re = /^(0[5-9]0[-( ]?\d{4}[-) ]?\d{4}|0120[-( ]?\d{3}[-) ]?\d{3})$/;
    return re.test(phone) || phone.length >= 10;
};

export const validateRequired = (value: any): boolean => {
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return !isNaN(value);
    return !!value;
};
