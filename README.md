# DirectMe - Worker

The focus behind this final year computing project is to make parking easier, and dynamic for the user. The idea works by using the external data that will be displayed in our application programming interface (API) which will be combined with the user’s information that has been specified previously in the application. This information will then be inserted into an algorithm that will determine what is the best location to park their vehicle within a radius of the postcode, geo-location, or street name given.

This component...

## Editors
* Martyn Fitzgerald - 16025948

## Finite State Diagram

This is a diagram that shows how the system shall be used.

<div align="center">
![Finite State Diagram](./git_screenshots/DirectMe_Worker.png)
</div>

<hr>

## Software Used

* Node.js
* Visual Studio Code
* Lucidchart
* Amazon Web Services (AWS)

## Setup Enviroment (Windows/Cloud Services)

1. Install Git (https://gitforwindows.org/).
2. Install Node.js 12+ LTS (https://nodejs.org/en/download/).
3. Setup DirectMe API (https://gitlab.uwe.ac.uk/m4-fitzgerald/DirectMe-API).
4. Create a AWS account, if one does't already exist.

## Installation

1. Open Command Prompt.
2. Clone the git repository to your computer's workspace.
```bash
git clone https://gitlab.uwe.ac.uk/m4-fitzgerald/DirectMe-Worker.git
```
3. Move into the folder of the repository.
```bash
cd DirectMe-Worker
```
4. Install all dependencies.
```bash
npm install
```
5. Change the endpoint of AWS in apiMethods.js to the one created within the API component.
6. Zip all internal files within the folder DirectMe-Worker. Note: Don't just do the main folder, make sure you highlight all of the files inside! 
7. Sign into AWS Management Console. 
8. Open the 'Services' Menu and then select the service 'Lambda' under the sub menu of 'Compute'.
![AWS 1](./git_screenshots/aws1.png)
9. Select option 'Create Function'.
![AWS 2](./git_screenshots/aws2.png)
10. Afterwards it will ask what type of function the environment will be, select 'Author from scratch'.
11. Give the function name a string like 'DirectMe_Worker'.
12. Select runtime as 'Node.js' ^12.x, then select option 'Create function'.
![AWS 3](./git_screenshots/aws3.png)
13. Within the environment select 'Actions' under 'Function code' and then select 'Upload a .zip file' then choose the zip file created previously. To upload the environment it may take a few minutes. 
![AWS 4](./git_screenshots/aws4.png)
14. In the new environment select 'Triggers'.
![AWS 5](./git_screenshots/aws5.png)
15. Within 'Trigger configuration' select a trigger named 'CloudWatch Events/EventBridge'.
![AWS 6](./git_screenshots/aws6.png)
16. Add a new rule by selecting 'Create a new rule'.
![AWS 7](./git_screenshots/aws7.png)
17. Insert name of event and also include a schedule expression by either using cron or rate.
18. Press add to insert the trigger.
![AWS 8](./git_screenshots/aws8.png)
