/* Add supplied semester material here. Unavailable lessons never earn progress. */
window.CAMPUS_DATA = {
  totalSemesters: 8,
  subjects: [
    {id:'pea101',code:'PEA 101',semester:1,name:'Problem Solving and Critical Thinking',short:'Think clearly. Solve confidently.',icon:'brain',color:'mint',units:[]},
    {id:'pea102',code:'PEA 102',semester:1,name:'Engineering Mathematics',short:'Build your mathematical foundation.',icon:'math',color:'lavender',units:[]},
    {id:'pea103',code:'PEA 103',semester:1,name:'AI Interaction Design',short:'Explore thoughtful human–AI experiences.',icon:'spark',color:'peach',units:[]},
    {id:'pea104',code:'PEA 104',semester:1,name:'Object Oriented Programming Fundamentals',short:'Turn ideas into structured programs.',icon:'code',color:'blue',units:[]},
    {id:'pea105',code:'PEA 105',semester:1,name:'Data Structures and Algorithms Problem Solving',short:'Organize data. Develop better solutions.',icon:'layers',color:'yellow',units:[]},
    {id:'pea106',code:'PEA 106',semester:1,name:'Introduction to Global Coding Competitions',short:'Practice, challenge yourself, and grow.',icon:'trophy',color:'pink',units:[]}
  ],
  announcements:[
    {id:'welcome',category:'Workspace',title:'Your learning space is ready',body:'Start with PEA 101, Unit 1. Your reading progress, notes, and quiz attempts are saved for your profile on this browser.'},
    {id:'material',category:'Course material',title:'PEA 101 · Unit 1 is available',body:'Six lessons and a 30-question bank based on the notes you provided. Further units will open for study when their learning material is added.'},
    {id:'schedule',category:'Getting started',title:'Make a little room for learning',body:'Add your own deadlines to Schedule and choose a weekly study goal. Faculty announcements will appear here once faculty tools are connected.'}
  ]
};

const TOPICS_1 = [
 {id:'framing',title:'Problem Identification and Framing',minutes:7,sections:[
  ['1.1 What is a problem?','A problem is a situation in which we want to achieve a goal, but the method for achieving it is not immediately clear. There is a gap between the current situation and a desired outcome.','Examples include planning how to improve examination marks, reducing a canteen queue, finding the largest number in an array, and reducing water use on a farm.'],
  ['1.2 Problem identification','Identify what is wrong, missing, inefficient, or in need of improvement. Observe the situation and collect relevant information before selecting a solution.','In a college canteen, students wait a long time during lunch. The problem is the waiting time; adding more counters is only one possible solution.'],
  ['1.3 Problem framing','Frame the identified problem clearly so that you solve the right problem. A statement that assumes a solution too early can hide other explanations.'],
  ['1.4 Elements of a good problem statement','Describe the current situation, the problem, the people or systems affected, the desired outcome, and the scope.','Example: Students in a class score below the expected level in mathematics. Identify the main learning difficulties and develop a study-support approach to improve understanding.'],
  ['1.5 A problem and a possible solution','Long canteen queues could be addressed through online ordering or improved service. Difficulty finding books could lead to a library search system. Electricity wasted in empty classrooms could lead to automatic lighting. Understand the problem before choosing among solutions.'],
  ['1.6 Steps to frame a problem','Observe → identify the gap → collect information → identify affected people → investigate possible causes → write a problem statement → verify that it addresses the actual problem.','Programming example: for the largest value in an array, input is an array of numbers; output is its maximum value. The result must be greater than or equal to every array element.']
 ],example:{title:'A better starting point',text:'“The canteen needs more counters” assumes a solution. “Students experience long waiting times during lunch hours” describes the problem and leaves room to investigate.'},task:'Students cannot find the books they need. Write the current situation, problem, affected people, desired outcome, and a clear problem statement. Suggest two possible solutions.'},
 {id:'requirements',title:'Requirements and Expected Outcomes',minutes:6,sections:[
  ['2.1 What are requirements?','Requirements describe what a solution must do, provide, or satisfy. An online library system might need book search, availability checking, catalogue updates, and protection of user information.'],
  ['2.2 Functional and non-functional requirements','Functional requirements describe what a system does: log in, find a book, calculate attendance, or generate results. Non-functional requirements describe how well it works or the conditions it must meet: reliability, usability, response time, and protection of information.'],
  ['2.3 Expected outcomes','An expected outcome is the result to achieve. Make it clear and measurable when possible. Reducing average canteen waiting time from 12 to 6 minutes is an illustrative 50% reduction target; actual targets should come from collected data.'],
  ['2.4 Input–Process–Output','Input is the data supplied, processing is the operation on that data, and output is the resulting information. For marks 70, 80, and 90: add the three marks, divide by 3, and output 80.'],
  ['2.5 Success criteria','Success criteria explain how to check that requirements and expected outcomes have been achieved. Examples include producing the correct result, meeting the response-time target, preventing unauthorized access, staying within budget, and letting users complete their task.']
 ],example:{title:'From a goal to a check',text:'Requirement: search for a book. Expected outcome: students find books more quickly. Success criterion: searches return the right availability and shelf location within the agreed response time.'},task:'For an assignment submission system, list five functional requirements, three non-functional requirements, three constraints, two assumptions, and three measurable success criteria.'},
 {id:'constraints',title:'Constraints and Assumptions',minutes:7,sections:[
  ['3.1 Constraints','A constraint is a limitation a solution must satisfy. Time, budget, memory, hardware, technology, security, and available people or materials can limit possible solutions.','Example: a college event application must be built in 15 days by three students on a limited budget, while protecting student information. A costly solution requiring several months would not fit.'],
  ['3.2 Assumptions','An assumption is something temporarily accepted as true while analysing a problem, even if it has not been verified. For attendance calculations, we might assume equal class weights, accurate records, and a known class total. Check assumptions when possible.'],
  ['3.3 Constraints versus assumptions','A budget of ₹10,000 limits the solution and is a constraint. Assuming internet access is available helps analysis but needs checking. Constraints must be respected or addressed; assumptions should be verified.'],
  ['3.4 Boundary conditions','A boundary condition lies at the edge of an allowed input or operating range. If voting starts at age 18, test 17, 18, and 19. An array algorithm should consider an empty array, a single element, and multiple elements.','An algorithm that finds a maximum must handle an empty array explicitly rather than assuming an element exists.'],
  ['3.5 Why identify them?','They help avoid unrealistic solutions, estimate resources, identify missing information, make logical decisions, handle special cases, and reduce unexpected failures.']
 ],example:{title:'The edge is part of the problem',text:'A result portal accepting marks from 0 to 100 must handle 0 and 100 correctly, and reject values outside that range. “All marks are valid” is an assumption, not a validation strategy.'},task:'For a student-result portal, identify two constraints, two assumptions, and two boundary conditions. Consider time, budget, missing records, and minimum or maximum marks.'},
 {id:'decomposition',title:'Problem Decomposition',minutes:6,sections:[
  ['4.1 Breaking down a problem','Decomposition divides a large or complex problem into smaller, manageable subproblems. A college management system can contain registration, faculty, attendance, examinations, fees, timetables, and reports.'],
  ['4.2 Benefits','Smaller parts reduce complexity, improve planning, support teamwork, make testing easier, simplify debugging, and encourage reuse. Each module has a specific responsibility.'],
  ['4.3 A student result system','Divide the system into reading marks, validating marks, calculating totals, calculating averages, determining grades, and displaying the result. Validation checks whether marks are within the permitted range before calculations begin.'],
  ['4.4 Decomposition in programming','Each step can become a separate function when appropriate. For five subjects, first read five marks, validate them, calculate the total and average, determine the grade according to supplied rules, and display the result.'],
  ['4.5 The top-down approach','Start with the overall problem and progressively break it into smaller tasks. Move from “Student Result System” to its modules and then their detailed steps.'],
  ['4.6 Dependencies','Identify both the parts and their order. Marks must be entered before validation. Validated marks are needed before calculating a total. The total is needed before calculating an average.']
 ],example:{title:'A sequence you can test',text:'Read marks → validate marks → calculate total → calculate average → determine grade → display result. A small validation function can be tested without running the whole application.'},task:'Decompose a five-subject result system into at least six steps. Order them, identify dependencies, choose two functions, and explain how this helps testing.'},
 {id:'abstraction',title:'Abstraction and Relevant Information',minutes:7,sections:[
  ['5.1 What is abstraction?','Focus on the important details for the current purpose while leaving out unnecessary details. At an ATM, users can withdraw cash, check a balance, or change a PIN without knowing the bank server implementation.'],
  ['5.2 Attendance example','To calculate attendance percentage, use classes attended and total classes conducted: attendance = (attended ÷ conducted) × 100. Height, home address, favourite subject, and blood group are not needed for that calculation. A full attendance application may need identity and reporting information.'],
  ['5.3 Relevant information','Relevant information contributes to understanding the problem, making a decision, or producing the result. For a programming laptop, RAM, processor, storage, battery life, price, and software compatibility may matter. Packaging colour usually does not, unless appearance is an explicit requirement.'],
  ['5.4 Abstraction versus ignoring information','Do not discard essential details. Marks may be irrelevant to an attendance calculation, but student identity matters when recording attendance, and privacy matters when designing the complete system. Relevance depends on purpose.'],
  ['5.5 Levels of abstraction','For online shopping: the high-level view is “a customer buys a product”; the middle level includes search, cart, payment, and orders; the low level includes queries, validation, network requests, and algorithms.','In C++, classes and access specifiers support abstraction, along with abstract classes and pure virtual functions.'],
  ['5.6 Benefits','Abstraction reduces complexity, improves understanding, organizes information, simplifies design, supports modular development, and keeps attention on the objective.']
 ],example:{title:'Ask: relevant to which task?',text:'A student’s identity is unnecessary for calculating one percentage, but essential for saving that percentage to the right student record.'},task:'Choose the most relevant factors for a programming laptop. Explain your choices and identify missing information. Consider RAM, processor, storage, price, battery life, colour, packaging, compatibility, warranty, and logo size.'},
 {id:'representation',title:'Structured Problem Representation',minutes:8,sections:[
  ['6.1 Organizing the problem','Represent a problem using organized text, diagrams, tables, flowcharts, formulas, or models. This helps communicate the problem, identify inputs and outputs, show relationships and steps, and reveal missing requirements.'],
  ['6.3 Choosing a representation','Use a problem statement to define the problem, an IPO model for inputs and outputs, a flowchart for step order, a decision tree for decisions and outcomes, a table for comparisons, a formula for mathematical relationships, and a block diagram for major components.'],
  ['6.4 A useful checklist','What is the problem? What must the solution achieve? What data is needed? What restrictions and assumptions apply? How can it be decomposed? Which information matters? Which representation communicates it clearly?'],
  ['Integrated example: college library search','Problem: students take too long to locate books. Requirements: search by title or author and view availability and shelf location. Constraints: budget, computers, and time. Assumption: a digital or digitizable catalogue exists.','Decompose into book records, search, availability checking, shelf-location display, and administration. Focus on title, author, availability, and location. Represent the system with an IPO model, a search flowchart, and book-record tables.'],
  ['Finding the larger of two numbers','Input two numbers A and B. If A > B, output A. Otherwise, if B > A, output B. Otherwise report equality. Include test cases for each of the three outcomes.'],
  ['The complete sequence','Identify → Define → Specify → Constrain → Decompose → Abstract → Represent → Solve → Verify. Clear understanding provides the foundation for a useful solution.']
 ],example:{title:'One problem, several useful views',text:'For comparing two numbers, a statement defines the task, an IPO table describes the data, a flowchart shows the choices, and test cases check greater-than, less-than, and equality.'},task:'Write a statement, IPO model, pseudocode, and flowchart for comparing two numbers. Make a table with at least four test cases, including equal numbers.'}
];

const UNIT_OUTLINES = [
 ['u1','Problem Understanding and Representation',TOPICS_1],
 ['u2','Logical Reasoning and Evidence',['Statements, Facts, Assumptions and Conclusions','Logical Relationships and Consistency','Necessary and Sufficient Conditions','Cause, Effect and Correlation','Evidence, Claims and Counterexamples','Reasoning Errors and Cognitive Biases']],
 ['u3','Problem Solving Strategies',['Trial, Verification and Elimination','Forward and Backward Reasoning','Simplification and Reduction','Smaller Instances and Progressive Construction','Pattern Recognition and Generalisation','Heuristics, Experimentation and Alternative Strategies']],
 ['u4','Structured Thinking and Decision Making',['Decision Structures and Decision Trees','Priorities and Constraint Handling','Trade-off Analysis','Root-Cause Analysis','Risk and Consequence Analysis','Solution Selection and Justification']],
 ['u5','Applied Problem Solving and Solution Improvement',['Problem Solving with Incomplete and Ambiguous Information','Multi-Step Problems and Dependencies','Estimation and Reasonableness Checking','Competing Constraints and Solution Evaluation','Failure Analysis and Limitation Identification','Iterative Solution Improvement']]
];
window.CAMPUS_DATA.subjects[0].units=UNIT_OUTLINES.map(([id,title,topics],i)=>({id,title,available:i===0,topics:topics.map((t,j)=>typeof t==='string'?{id:`${id}t${j+1}`,title:t,sections:[]}:t),questions:[]}));

window.CAMPUS_DATA.subjects[0].units[0].questions=[
  {
    "id": "u1q1",
    "prompt": "What is a problem?",
    "options": [
      "A situation with no goal",
      "A situation where the method to achieve a goal is not immediately clear",
      "A completed task",
      "A programming language"
    ],
    "answer": 1,
    "topic": "framing",
    "explanation": "A problem has a goal, but the way to achieve it is not immediately clear."
  },
  {
    "id": "u1q2",
    "prompt": "What should be done before selecting a solution?",
    "options": [
      "Start coding",
      "Purchase equipment",
      "Understand and define the problem",
      "Select a programming language"
    ],
    "answer": 2,
    "topic": "framing",
    "explanation": "Understanding the problem comes before choosing or implementing a solution."
  },
  {
    "id": "u1q3",
    "prompt": "Which is the best problem statement?",
    "options": [
      "The canteen needs a new building.",
      "Students experience long waiting times in the canteen during lunch hours.",
      "Buy more computers.",
      "Develop an application immediately."
    ],
    "answer": 1,
    "topic": "framing",
    "explanation": "The waiting-time statement describes the problem without assuming a particular solution."
  },
  {
    "id": "u1q4",
    "prompt": "Which is an element of a good problem statement?",
    "options": [
      "Current situation",
      "Desired outcome",
      "Scope of the problem",
      "All of the above"
    ],
    "answer": 3,
    "topic": "framing",
    "explanation": "A good problem statement includes the current situation, desired outcome, and scope, along with who is affected."
  },
  {
    "id": "u1q5",
    "prompt": "What is the main purpose of problem framing?",
    "options": [
      "To start coding immediately",
      "To express the problem clearly and focus on what needs to be solved",
      "To ignore the causes",
      "To select the most expensive solution"
    ],
    "answer": 1,
    "topic": "framing",
    "explanation": "Problem framing expresses the actual problem clearly and keeps attention on the right goal."
  },
  {
    "id": "u1q6",
    "prompt": "Requirements describe:",
    "options": [
      "Only the cost of a project",
      "What a solution must do, provide, or satisfy",
      "Only the programming language",
      "Only the project title"
    ],
    "answer": 1,
    "topic": "requirements",
    "explanation": "Requirements describe what a solution must do, provide, or satisfy."
  },
  {
    "id": "u1q7",
    "prompt": "Which is a functional requirement?",
    "options": [
      "The system should be secure.",
      "The system should be reliable.",
      "Students should be able to search for books.",
      "The system should respond quickly."
    ],
    "answer": 2,
    "topic": "requirements",
    "explanation": "Searching for books is an action the system must provide: a functional requirement."
  },
  {
    "id": "u1q8",
    "prompt": "Which is a non-functional requirement?",
    "options": [
      "Generate examination results",
      "Search for books",
      "Calculate attendance",
      "Protect user information"
    ],
    "answer": 3,
    "topic": "requirements",
    "explanation": "Protection of user information is treated as a non-functional requirement in the supplied notes."
  },
  {
    "id": "u1q9",
    "prompt": "What is an expected outcome?",
    "options": [
      "A limitation on the project",
      "A result that should be achieved",
      "An unverified assumption",
      "A programming error"
    ],
    "answer": 1,
    "topic": "requirements",
    "explanation": "An expected outcome is the result the solution should achieve."
  },
  {
    "id": "u1q10",
    "prompt": "What is the purpose of success criteria?",
    "options": [
      "To verify whether the desired outcome has been achieved",
      "To increase the number of requirements",
      "To avoid testing",
      "To select a programming language"
    ],
    "answer": 0,
    "topic": "requirements",
    "explanation": "Success criteria are checks used to verify the desired outcome."
  },
  {
    "id": "u1q11",
    "prompt": "In the IPO model, which component performs operations on input data?",
    "options": [
      "Input",
      "Process",
      "Output",
      "Constraint"
    ],
    "answer": 1,
    "topic": "requirements",
    "explanation": "The process performs operations on input data to produce output."
  },
  {
    "id": "u1q12",
    "prompt": "Which of the following is a constraint?",
    "options": [
      "The project must be completed within two weeks.",
      "The internet is available.",
      "The input data is correct.",
      "All users have computers."
    ],
    "answer": 0,
    "topic": "constraints",
    "explanation": "A two-week deadline limits the solution, making it a constraint."
  },
  {
    "id": "u1q13",
    "prompt": "Which is an assumption?",
    "options": [
      "The project budget is ₹10,000.",
      "The project deadline is Friday.",
      "The internet connection is available.",
      "Only five computers are available."
    ],
    "answer": 2,
    "topic": "constraints",
    "explanation": "Internet availability is accepted as true in this example and should be verified."
  },
  {
    "id": "u1q14",
    "prompt": "What is the main difference between a constraint and an assumption?",
    "options": [
      "They have exactly the same meaning.",
      "A constraint limits a solution, while an assumption is accepted as true for analysis.",
      "An assumption always limits the budget.",
      "A constraint is always unverified."
    ],
    "answer": 1,
    "topic": "constraints",
    "explanation": "Constraints restrict a solution; assumptions are temporarily accepted facts used in analysis."
  },
  {
    "id": "u1q15",
    "prompt": "If a person is eligible to vote at age 18 or above, which is an important boundary case?",
    "options": [
      "Age 10",
      "Age 15",
      "Age 18",
      "Age 30 only"
    ],
    "answer": 2,
    "topic": "constraints",
    "explanation": "Age 18 is the exact threshold where eligibility changes."
  },
  {
    "id": "u1q16",
    "prompt": "Which is an important boundary case for an algorithm that finds the largest element in an array?",
    "options": [
      "Empty array",
      "Single-element array",
      "Array with multiple elements",
      "All of the above"
    ],
    "answer": 3,
    "topic": "constraints",
    "explanation": "The provided answer is D: all three cases should be tested. Empty and single-element arrays are the specific boundary cases; multiple elements are a normal-case check."
  },
  {
    "id": "u1q17",
    "prompt": "Problem decomposition means:",
    "options": [
      "Combining all tasks into one large task",
      "Breaking a complex problem into smaller subproblems",
      "Ignoring difficult tasks",
      "Removing all requirements"
    ],
    "answer": 1,
    "topic": "decomposition",
    "explanation": "Decomposition breaks a complex problem into smaller, manageable parts."
  },
  {
    "id": "u1q18",
    "prompt": "Which is a benefit of problem decomposition?",
    "options": [
      "It makes testing more difficult.",
      "It prevents teamwork.",
      "It makes complex problems easier to manage.",
      "It eliminates the need for planning."
    ],
    "answer": 2,
    "topic": "decomposition",
    "explanation": "Smaller parts make complex work easier to plan, implement, and test."
  },
  {
    "id": "u1q19",
    "prompt": "The top-down approach starts with:",
    "options": [
      "The smallest task",
      "The complete problem",
      "The final output only",
      "A random subproblem"
    ],
    "answer": 1,
    "topic": "decomposition",
    "explanation": "A top-down approach begins with the whole problem and breaks it into smaller parts."
  },
  {
    "id": "u1q20",
    "prompt": "In a student result system, which task should normally happen before calculating the average?",
    "options": [
      "Display the final result",
      "Validate the marks and calculate the total",
      "Delete the marks",
      "Print the grade before processing"
    ],
    "answer": 1,
    "topic": "decomposition",
    "explanation": "Validate marks and calculate their total before using that total to calculate an average."
  },
  {
    "id": "u1q21",
    "prompt": "What is abstraction?",
    "options": [
      "Including every available detail",
      "Focusing on essential details and ignoring unnecessary ones",
      "Removing all information",
      "Making a problem more complex"
    ],
    "answer": 1,
    "topic": "abstraction",
    "explanation": "Abstraction keeps details that matter to the current purpose and removes unnecessary complexity."
  },
  {
    "id": "u1q22",
    "prompt": "Which information is relevant when calculating attendance percentage?",
    "options": [
      "Student's favourite colour",
      "Student's height",
      "Classes attended and total classes",
      "Student's favourite sport"
    ],
    "answer": 2,
    "topic": "abstraction",
    "explanation": "Attendance percentage uses classes attended divided by total classes, multiplied by 100."
  },
  {
    "id": "u1q23",
    "prompt": "When using an ATM, which is an example of abstraction?",
    "options": [
      "The user must understand every bank server operation.",
      "The user can withdraw cash without knowing the internal implementation.",
      "The user must write a program.",
      "The user must know the bank's database design."
    ],
    "answer": 1,
    "topic": "abstraction",
    "explanation": "An ATM exposes useful actions while hiding internal implementation details."
  },
  {
    "id": "u1q24",
    "prompt": "Which statement about abstraction is correct?",
    "options": [
      "All details must always be ignored.",
      "Only the appearance of a system matters.",
      "Relevant details depend on the purpose of the problem.",
      "Abstraction prevents problem solving."
    ],
    "answer": 2,
    "topic": "abstraction",
    "explanation": "A detail can be relevant for one task and irrelevant for another."
  },
  {
    "id": "u1q25",
    "prompt": "In an online shopping system, which is a high-level view?",
    "options": [
      "A customer buys a product.",
      "A database query executes.",
      "A network request is processed.",
      "A variable is declared."
    ],
    "answer": 0,
    "topic": "abstraction",
    "explanation": "The high-level view describes the overall purpose without implementation details."
  },
  {
    "id": "u1q26",
    "prompt": "Which representation is best for identifying inputs, processing, and outputs?",
    "options": [
      "IPO model",
      "Decision tree only",
      "Paragraph of unrelated text",
      "Project budget"
    ],
    "answer": 0,
    "topic": "representation",
    "explanation": "The IPO model explicitly organizes input, processing, and output."
  },
  {
    "id": "u1q27",
    "prompt": "Which representation uses standard symbols to show the steps of an algorithm?",
    "options": [
      "Table",
      "Flowchart",
      "Assumption",
      "Requirement list"
    ],
    "answer": 1,
    "topic": "representation",
    "explanation": "A flowchart uses symbols and connections to show an algorithm?s steps."
  },
  {
    "id": "u1q28",
    "prompt": "Which symbol is commonly used for a decision in a flowchart?",
    "options": [
      "Rectangle",
      "Oval",
      "Diamond",
      "Parallelogram"
    ],
    "answer": 2,
    "topic": "representation",
    "explanation": "A diamond represents a decision in a conventional flowchart."
  },
  {
    "id": "u1q29",
    "prompt": "Which representation is most suitable for organizing values and their corresponding results?",
    "options": [
      "Table",
      "Assumption",
      "Problem statement only",
      "Constraint list"
    ],
    "answer": 0,
    "topic": "representation",
    "explanation": "A table organizes values and corresponding results for easy comparison."
  },
  {
    "id": "u1q30",
    "prompt": "Which sequence best represents the overall problem-solving process taught in Unit I?",
    "options": [
      "Code → Submit → Stop",
      "Identify → Define → Specify → Constrain → Decompose → Abstract → Represent → Solve → Verify",
      "Guess → Build → Ignore → Finish",
      "Select → Code → Avoid testing"
    ],
    "answer": 1,
    "topic": "representation",
    "explanation": "The complete process moves from identifying and representing the problem to solving and verifying it."
  }
];
