# Visual Novel Studio

Visual Novel Studio is an interactive storytelling platform designed for educators, students, writers, and creative professionals. Create and experience engaging stories that promote personal growth, learning, and positive values.

## ✨ Features

- **Educational Focus**: Content designed to teach valuable skills and promote personal development
- **Character Development**: Build meaningful relationships and guide character growth through story activities
- **Extension System**: Community-created content expands available stories and experiences
- **Progressive Web App**: Works offline and can be installed on desktop and mobile devices
- **Inclusive Design**: Welcomes users of all backgrounds with accessible, age-appropriate content

## 🎯 Target Audiences

- **Educators**: Interactive curriculum materials for social-emotional learning
- **Students**: Engaging platform for developing life skills and academic abilities
- **Writers**: Tools for creating interactive stories and exploring narrative techniques
- **Creative Professionals**: Platform for developing storytelling and character development skills

## 🚀 Getting Started

### For Users

#### Quick Start
1. Open Visual Novel Studio in your web browser
2. Create your first character by clicking "New Character"
3. Choose from available story activities and begin your journey
4. Track character development and relationship building
5. Explore extensions for additional content and experiences

#### System Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for initial setup and extension downloads
- Works offline after initial load
- Compatible with desktop, tablet, and mobile devices

### For Developers

#### Development Setup
```bash
# Clone the repository
git clone <repository-url>
cd visual-novel-studio

# Install dependencies
npm install

# Start development server
ng serve
```

Navigate to `http://localhost:4200/`. The app will automatically reload when you make changes.

#### Building for Production
```bash
# Build the project
ng build --prod

# Serve the built app (for testing)
ng serve --prod
```

Build artifacts are stored in the `dist/` directory.

#### Running Tests
```bash
# Unit tests
ng test

# End-to-end tests
ng e2e

# Linting
ng lint
```

## 🏗️ Architecture

### Progressive Web App (PWA)
- **Offline Support**: Full functionality available without internet connection
- **Cross-Platform**: Runs in browsers and can be installed as native app
- **Performance**: Optimized loading and caching for smooth user experience
- **Responsive**: Adapts to different screen sizes and devices

### Extension System
Content is expandable through community-created extensions:

- **Character Extensions**: New characters with unique stories and development arcs
- **Story Arc Extensions**: Complete narrative experiences with multiple chapters  
- **Activity Extensions**: New activities and tasks for character development
- **Asset Extensions**: Visual and audio resources for other creators

### Technology Stack
- **Framework**: Angular 8 with TypeScript
- **UI Library**: Angular Material following Material Design principles
- **State Management**: NgRx Store for predictable application state
- **Database**: IndexedDB for offline data storage
- **Build Tools**: Angular CLI for development and build processes

### State Management
Game state is managed through NgRx Store and includes:
- Character progression and statistics
- Relationship levels and story progress
- User preferences and settings
- Extension content and assets
- Save/load functionality through `SavesService`

## 📚 Documentation

- **[User Manual](USER-MANUAL.md)**: Complete guide for using Visual Novel Studio
- **[Content Creation Guidelines](GUIDELINES.md)**: Standards for creating appropriate content
- **[Extension Creator Guide](EXTENSION-CREATOR-GUIDE.md)**: Detailed guide for creating extensions
- **[Content Standards](CONTENT-STANDARDS.md)**: Platform content policies and standards

## 🤝 Contributing

We welcome contributions from educators, writers, developers, and community members!

### Content Creation
- Create educational characters and stories
- Follow our [Content Standards](CONTENT-STANDARDS.md)
- Use the [Extension Creator Guide](EXTENSION-CREATOR-GUIDE.md) for technical details
- Submit content through our review process

### Code Contributions
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following our coding standards
4. Write or update tests as needed
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Bug Reports and Feature Requests
- Use GitHub Issues to report bugs or suggest features
- Provide clear descriptions and steps to reproduce issues
- Check existing issues before creating new ones
- Follow the issue templates when available

## 🎓 Educational Applications

### Classroom Integration
- **Social-Emotional Learning (SEL)**: Character development activities align with SEL standards
- **Language Arts**: Reading comprehension and creative writing opportunities
- **Critical Thinking**: Problem-solving scenarios and decision-making practice
- **Cultural Awareness**: Diverse characters and inclusive storytelling
- **Digital Literacy**: Technology skills through interactive media

### Assessment Opportunities
- Character development choices reflect student understanding
- Story outcomes provide discussion starting points
- Progress tracking supports formative assessment
- Collaborative features encourage peer learning

## 🔒 Privacy and Safety

- **Local Storage**: User data stored locally on device, not transmitted to servers
- **Age-Appropriate Content**: All content suitable for ages 13+ with educational focus
- **Inclusive Environment**: Platform designed to welcome users of all backgrounds
- **Content Moderation**: Community-submitted content reviewed for appropriateness
- **Privacy First**: Minimal data collection with user consent

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Angular team for the excellent framework and tooling
- Material Design team for comprehensive design guidelines  
- Community contributors who create educational content
- Educators who provide feedback and guidance on learning objectives
- Open source libraries and tools that make this project possible

## 📧 Contact

- **General Questions**: info@visualnovelstudio.com
- **Content Support**: content@visualnovelstudio.com
- **Technical Support**: support@visualnovelstudio.com
- **Community**: Join our forums at [community.visualnovelstudio.com](http://community.visualnovelstudio.com)

---

**Visual Novel Studio** - Interactive storytelling for learning and growth