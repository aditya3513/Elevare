# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . .

# Install the required Python packages
RUN pip install --upgrade pip && pip install -r requirements.txt

# Expose port 80 for the app
EXPOSE 9000

# Run the app with Uvicorn when the container launches
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "9000"]
