import React from 'react';
import styled from 'styled-components';
import GameBackground from './GameBackground';

const Container = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
`;

const Content = styled.div`
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  color: white;
  padding: 3rem;
`;

const HeroSection = styled.div`
  padding-left: 10rem;
`;

const Heading = styled.h1`
  font-size: 3.75rem;
  font-weight: bold;
  margin-bottom: 2rem;
`;

const Description = styled.p`
  font-size: 1.875rem;
  margin-bottom: 3rem;
`;

const Button = styled.button`
  padding: 1rem 2rem;
  background-color: #1f2937;
  color: white;
  font-size: 1.25rem;
  border-radius: 0.375rem;
  border: 1px solid #374151;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #374151;
  }
`;

function App() {
    return (
        <Container className="app-container">
            <GameBackground className="game-background" />
            <Content className="content-wrapper">
                <HeroSection className="hero-section">
                    <Heading className="hero-heading">Hello,<br />I'm Danny</Heading>
                    <Description className="hero-description">Lead Frontend Developer <br />at Lightstorm Entertainment</Description>
                    <Button className="projects-button">
                        View Projects
                    </Button>
                </HeroSection>
            </Content>
        </Container>
    );
}

export default App;