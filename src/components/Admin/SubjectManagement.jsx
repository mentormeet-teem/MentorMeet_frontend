import React from 'react';
import '../../styles/Dashboard.css';
const PREDEFINED_SUBJECTS = [
  { subjectId: 1, name: 'Mathematics', category: 'Sciences' },
  { subjectId: 2, name: 'Physics', category: 'Sciences' },
  { subjectId: 3, name: 'Chemistry', category: 'Sciences' },
  { subjectId: 4, name: 'Biology', category: 'Sciences' },
  { subjectId: 5, name: 'English', category: 'Languages' },
  { subjectId: 6, name: 'Amharic', category: 'Languages' },
  { subjectId: 7, name: 'ICT', category: 'Technology' },
  { subjectId: 8, name: 'Economics', category: 'Business' },
  { subjectId: 9, name: 'Business Studies', category: 'Business' },
];

const SubjectManagement = () => {
  const subjectsByCategory = PREDEFINED_SUBJECTS.reduce((acc, subject) => {
    const category = subject.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(subject);
    return acc;
  }, {});

  return (
    <div className="subject-management">
      <div className="subjects-container">
        {Object.entries(subjectsByCategory).map(([category, categorySubjects]) => (
          <div key={category} className="subject-category">
            <div className="category-header">
              <h3>{category}</h3>
            </div>
            <div className="subjects-grid">
              {categorySubjects.map((subject) => (
                <div key={subject.subjectId} className="subject-item">
                  {subject.name}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubjectManagement;
