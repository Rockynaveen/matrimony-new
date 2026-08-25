import { z } from 'zod';

export const registerSchema = z
  .object({
    register_for: z.enum(['SELF', 'SON', 'DAUGHTER', 'BROTHER', 'SISTER', 'FRIEND', 'RELATIVE'], {
      required_error: 'Please select who you are registering for'
    }),
    first_name: z.string().min(2, 'First name must be at least 2 characters'),
    last_name: z.string().min(1, 'Last name is required'),
    gender: z.enum(['Male', 'Female'], {
      required_error: 'Please select a gender'
    }),
    date_of_birth: z.string().min(10, 'Please enter a valid date of birth (YYYY-MM-DD)'),
    email: z.string().email('Please enter a valid email address'),
    phone: z
      .string()
      .min(10, 'Phone number must be at least 10 digits')
      .regex(/^[0-9+\s-]+$/, 'Phone number can only contain numbers, spaces, or +'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm_password: z.string().min(6, 'Confirm password is required'),
    accept_terms: z.boolean().refine(val => val === true, {
      message: 'You must accept the Terms & Conditions to proceed'
    })
  })
  .refine(data => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password']
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().min(1, 'Email or Phone Number is required'),
  password: z.string().min(1, 'Password is required'),
  remember_me: z.boolean().optional()
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const basicProfileSchema = z.object({
  gender: z.enum(['Male', 'Female'], {
    required_error: 'Gender selection is required'
  }),
  date_of_birth: z.string().min(10, 'Date of birth is required'),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^[0-9+\s-]+$/, 'Phone number can only contain digits'),
  register_for: z.string().default('SELF'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string().min(6, 'Confirm password is required')
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password']
});

export type BasicProfileFormData = z.infer<typeof basicProfileSchema>;

export const personalStepSchema = z.object({
  about_me: z.string().min(20, 'Please write at least 20 characters about yourself'),
  height: z.string().min(1, 'Please select your height'),
  weight: z.string().min(1, 'Please enter your weight'),
  complexion: z.string().min(1, 'Please select your complexion'),
  marital_status: z.string().min(1, 'Please select marital status'),
  disability_info: z.string().min(1, 'Please select disability status')
});

export const educationCareerStepSchema = z.object({
  highest_education: z.string().min(1, 'Highest education is required'),
  occupation: z.string().min(1, 'Occupation is required'),
  annual_income: z.string().min(1, 'Annual income package is required')
});

export const religionStepSchema = z.object({
  religion: z.string().min(1, 'Religion is required'),
  caste: z.string().min(1, 'Caste is required'),
  subcaste: z.string().optional(),
  rashi: z.string().min(1, 'Rashi / Zodiac is required'),
  nakshatra: z.string().min(1, 'Nakshatra is required'),
  dosha: z.string().min(1, 'Dosha status is required')
});

export const familyStepSchema = z.object({
  family_type: z.string().min(1, 'Family type is required'),
  family_values: z.string().min(1, 'Family values are required'),
  family_status: z.string().min(1, 'Family status is required'),
  father_occupation: z.string().min(1, "Father's occupation is required"),
  mother_occupation: z.string().min(1, "Mother's occupation is required"),
  siblings: z.string().min(1, 'Siblings details are required')
});

export const lifestyleStepSchema = z.object({
  diet: z.string().min(1, 'Diet preference is required'),
  smoking: z.string().min(1, 'Smoking preference is required'),
  drinking: z.string().min(1, 'Drinking preference is required'),
  languages_known: z.array(z.string()).min(1, 'Select at least one language'),
  hobbies: z.array(z.string()).min(1, 'Select at least one hobby')
});

export const locationStepSchema = z.object({
  country: z.string().min(1, 'Country is required'),
  state: z.string().min(1, 'State is required'),
  city: z.string().min(1, 'City is required')
});
