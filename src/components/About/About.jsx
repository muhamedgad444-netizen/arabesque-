import React from "react";
import { NavLink } from "react-router-dom";
import "./About.css";

const About = () => {
  return (
    <div className="about-page">
      <header className="about-header">
        <NavLink to="/" className="about-brand">
          ARABESQUE
        </NavLink>
        <nav className="about-nav">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/products">Products</NavLink>
          <NavLink to="/about">About</NavLink>
        </nav>
      </header>

      <main className="about-content">
        <h1>ARABESQUE</h1>
        <p>
          ARABESQUE is an archival streetwear and utility menswear label
          defined by heavy-weight textiles, utilitarian cuts, and clean
          geometric paneling. Designed around a palette of washed charcoals,
          olive drabs, and deep slate tones, the brand blends industrial design
          elements with subtle cultural motifs.
        </p>

        <h2>The Outerwear</h2>
        <p>
          Industrial zip-up knitwear, washed-canvas bomber jackets, and
          heavy-duty field jackets built with functional utility pockets and
          oversized silhouettes.
        </p>

        <h2>The Essentials</h2>
        <p>
          Heavyweight boxy-fit tees, vintage-wash ribbed tank tops, and textured
          thermals styled with minimal branding.
        </p>

        <h2>The Bottoms</h2>
        <p>
          Reinforced double-knee trousers, wide-leg utility cargos, and classic
          washed denim engineered for daily durability.
        </p>

        <h2>The Heritage Series</h2>
        <p>
          Oversized technical sport jerseys featuring intricate Arabesque
          geometry and geometric pattern paneling along the sleeves and chest.
        </p>
      </main>
    </div>
  );
};

export default About;
