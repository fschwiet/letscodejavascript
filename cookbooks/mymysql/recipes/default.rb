#
# Cookbook Name:: mymysql
# Recipe:: default
#
# Copyright 2014, YOUR_COMPANY_NAME
#
# All rights reserved - Do Not Redistribute
#

mysql_service 'default' do

  server_root_password 	node['mysql']['server_root_password']
  version 				      node['mysql']['version']
  port 					        node['mysql']['port']
  data_dir 				      node['mysql']['data_dir']

  allow_remote_root true
  remove_anonymous_users true
  remove_test_database true

  action :create
end

template '/etc/mysql/conf.d/mysite.cnf' do
  owner 'mysql'
  source 'mysite.cnf.erb'
  notifies :restart, 'mysql_service[default]'
  action :create
end