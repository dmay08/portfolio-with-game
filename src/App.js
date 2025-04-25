import React, { useState } from 'react';
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
  
  @media (max-width: 768px) {
    padding: 1.5rem;
    justify-content: flex-end;
    padding-bottom: 9rem; /* Space for game buttons */
  }
`;

const HeroSection = styled.div`
  padding-left: 10rem;
  
  @media (max-width: 768px) {
    padding-left: 0;
    width: 100%;
  }
`;

const Heading = styled.h1`
  font-size: 3.75rem;
  font-weight: bold;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
  }
  
  @media (max-width: 480px) {
    font-size: 2rem;
  }
`;

const Description = styled.p`
  font-size: 1.875rem;
  margin-bottom: 3rem;
  
  @media (max-width: 768px) {
    font-size: 1.25rem;
    margin-bottom: 1rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1rem;
  }
`;

const Button = styled.button`
  padding: 1rem 2rem;
  background-color: #1f2937;
  color: white;
  font-size: 1.25rem;
  border-radius: 0.375rem;
  border: 1px solid #374151;
  transition: background-color 0.3s;
  
  @media (max-width: 768px) {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
  }
  
  &:hover {
    background-color: #374151;
  }
`;

function App() {
 
  const [isGameOver, setIsGameOver] = useState(false);

  return (
    <Container className="app-container">
      <GameBackground
        className="game-background"
        isGameOver={isGameOver}
        onSetGameOver={(value) => setIsGameOver(value)}
      />
      <Content className="content-wrapper">
        {!isGameOver && (
          <HeroSection className="hero-section">
            <Heading className="hero-heading">Hello,<br />I'm Danny</Heading>
            <Description className="hero-description">Lead Frontend Developer <br />at Lightstorm Entertainment</Description>
            <Button className="projects-button">
              View Projects
            </Button>
          </HeroSection>
        )}
      </Content>
    </Container>
  );
}

export default App;