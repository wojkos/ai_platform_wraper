Product Name

AI Platform Wrapper (MVP)

Purpose

The goal of this application is to integrate multiple existing and future AI-related tools into a single, cohesive platform, presenting them as one large application rather than a collection of separate utilities.

The platform acts as a wrapper / shell around independently developed modules (e.g. Agent Playground, Talk-to-Data, Langflow), unifying:

user experience

navigation

authentication (MVP-level)

visual identity

This MVP is intended as a demonstration of architectural thinking and delivery capability, not as a commercial SaaS product.

Target Users
Primary

Non-technical users:

interacting with agents

querying data via natural language

Stakeholders / management (demo audience)

Secondary

Advanced / technical users:

building pipelines in Langflow

experimenting with models and tools

Scope (MVP)
In Scope

Wrapper frontend application

Central navigation and layout

Authentication (safe MVP)

Module embedding via iframe

Static module configuration

Consistent visual style inspired by Langflow

Docker Compose–based local deployment

Out of Scope (for MVP)

Cross-module integration

Shared agent registry

Multi-tenancy

CI/CD

Production-grade security

Persistence of user profiles

Modules (Current)

Agent Playground

Talk-to-Data

Langflow

Each module:

runs in its own Docker container

is developed in a separate repository

exposes its own UI

is embedded into the wrapper via iframe

Future modules can be added without changing the core architecture.

Functional Requirements
Authentication

Simple username/password

Credentials stored in a local file

Authentication applies only at the wrapper level

No authentication handshake between wrapper and modules

Trusted local environment assumption (safe MVP)

Navigation & Layout

Persistent layout with:

sidebar or top navigation

module list

placeholder sections for:

User

Settings (fake data for MVP)

Selecting a module loads it in the main area via iframe

Module Configuration

Static configuration file defining:

module name

iframe URL

icon

description (optional)

No dynamic discovery in MVP.

UI / UX

Low-code / developer-friendly

Visual consistency inspired by Langflow:

typography

color palette

spacing

dark mode–first

Wrapper does not restyle module internals, only its own shell

Technical Architecture
Frontend

React + Vite

SPA

Responsible only for:

auth UI

layout

navigation

iframe embedding

Backend (Wrapper API)

Python

FastAPI

Responsibilities:

authentication

serving module configuration

health checks

Acts as a light API Gateway

Communication

REST only

Synchronous

No message queues

No event-driven architecture

Infrastructure

Docker Compose

Local-only deployment

Services:

wrapper-frontend

wrapper-backend

postgres

vector database (for Langflow)

external module containers (referenced, not implemented here)

Data

PostgreSQL (wrapper-level, minimal usage)

Vector DB included in compose for Langflow support

No backup / restore required

Non-Functional Requirements

Fast local startup

Clear separation of concerns

Easy to add new modules

Readable, explainable architecture

Demo-ready stability

Success Criteria

The application feels like one platform

Stakeholders clearly see:

extensibility

architectural foresight

clean separation between modules

New modules can be added by config + Docker only