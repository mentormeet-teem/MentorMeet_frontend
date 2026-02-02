# MentorMeet - Frontend

MentorMeet is a modern web application that connects mentors and mentees, facilitating knowledge sharing and professional growth. This repository contains the frontend implementation built with React and Vite.

## Features

- **User Authentication**: Secure login and registration system with JWT
- **Role-Based Access Control**: Different interfaces for mentors and mentees
- **Tutor Management**: Mentors can set their availability and manage sessions
- **Booking System**: Mentees can book sessions with available mentors
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Clean and intuitive user interface with smooth animations

## Tech Stack

- **Frontend Framework**: React 19
- **Build Tool**: Vite
- **State Management**: React Context API
- **Routing**: React Router v7
- **Styling**: CSS Modules
- **HTTP Client**: Axios
- **Animation**: Framer Motion
- **Icons**: React Icons
- **Form Handling**: React Hook Form
- **Date Handling**: date-fns
- **Authentication**: JWT

## Project Structure

```
src/
├── components/         # Reusable UI components
├── config/            # Application configuration
├── styles/            # Global styles and CSS modules
├── utils/             # Utility functions and helpers
├── App.jsx            # Main application component
└── main.jsx           # Application entry point
```

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd mentormeet-app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the root directory and add your environment variables:
   ```env
   VITE_API_BASE_URL=your_api_base_url
   # Add other environment variables as needed
   ```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Authentication

The application uses JWT for authentication. The authentication flow includes:
- User registration with email and password
- User login with JWT token
- Protected routes based on user roles
- Automatic token refresh (if implemented in the backend)

## Responsive Design

The application is designed to work on various screen sizes with a mobile-first approach. Media queries and responsive design principles are used throughout the application.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Contact

For any questions or feedback, please contact the development team.

- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).
## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
